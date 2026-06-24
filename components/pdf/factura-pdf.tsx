/**
 * Plantilla PDF para facturas electrónicas.
 * Usa @react-pdf/renderer — solo llamar desde API routes (no en RSC).
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { LineaFacturaMock } from "@/app/(dashboard)/ventas/actions";

// ─── Estilos ──────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 30,
    color: "#1a1a2e",
    backgroundColor: "#ffffff",
  },
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  empresa: { flex: 1 },
  empresaNombre: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#E85D24" },
  empresaSub: { fontSize: 8, color: "#666", marginTop: 2 },
  tipoDoc: { alignItems: "flex-end", justifyContent: "flex-start" },
  tipoDocLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1a1a2e" },
  consecutivoText: { fontSize: 8, color: "#666", marginTop: 2 },

  // Separador
  hr: { borderBottomWidth: 0.5, borderBottomColor: "#ddd", marginVertical: 8 },
  hrOrange: { borderBottomWidth: 1.5, borderBottomColor: "#E85D24", marginBottom: 10 },

  // Grid 2 col
  row2: { flexDirection: "row", gap: 12, marginBottom: 8 },
  card: { flex: 1, backgroundColor: "#f9fafb", borderRadius: 4, padding: 8 },
  cardLabel: { fontSize: 7, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  cardValue: { fontSize: 9, color: "#111", fontFamily: "Helvetica-Bold" },
  cardSub: { fontSize: 8, color: "#555", marginTop: 1 },

  // Clave numérica
  claveBox: { backgroundColor: "#f0f0f0", borderRadius: 4, padding: 6, marginBottom: 8 },
  claveLabel: { fontSize: 7, color: "#999", textTransform: "uppercase", letterSpacing: 0.5 },
  claveValue: { fontSize: 7, fontFamily: "Helvetica", color: "#333", marginTop: 2, letterSpacing: 0.5 },

  // Tabla de líneas
  tableHeader: { flexDirection: "row", backgroundColor: "#E85D24", borderRadius: 3, paddingVertical: 5, paddingHorizontal: 6, marginBottom: 2 },
  tableHeaderText: { color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 8 },
  tableRow: { flexDirection: "row", paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.3, borderBottomColor: "#eee" },
  tableRowAlt: { backgroundColor: "#fafafa" },
  colDesc: { flex: 3 },
  colQty: { width: 40, textAlign: "right" },
  colUnit: { width: 35, textAlign: "center" },
  colPrice: { width: 60, textAlign: "right" },
  colIva: { width: 45, textAlign: "right" },
  colTotal: { width: 60, textAlign: "right" },
  cellText: { fontSize: 8, color: "#333" },
  cellTextBold: { fontSize: 8, color: "#111", fontFamily: "Helvetica-Bold" },

  // Totales
  totalesBox: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
  totalesInner: { width: 200 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalLabel: { fontSize: 8, color: "#555" },
  totalValue: { fontSize: 8, color: "#111", fontFamily: "Helvetica-Bold", textAlign: "right" },
  totalFinalRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#E85D24", borderRadius: 3, paddingVertical: 5, paddingHorizontal: 8, marginTop: 4 },
  totalFinalLabel: { fontSize: 10, color: "#fff", fontFamily: "Helvetica-Bold" },
  totalFinalValue: { fontSize: 10, color: "#fff", fontFamily: "Helvetica-Bold" },

  // Footer
  footer: { position: "absolute", bottom: 20, left: 30, right: 30 },
  footerText: { fontSize: 7, color: "#aaa", textAlign: "center" },
});

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface FacturaPDFData {
  tipoComprobante: string;
  consecutivo: string | null;
  claveNumerica: string | null;
  fecha: Date;
  clienteNombre: string;
  tipoPago: string;
  moneda: string;
  estado: string;
  estadoMH: string;
  subtotal: string;
  descuento: string;
  impuesto: string;
  total: string;
  lineas: LineaFacturaMock[];
  empresaNombre: string;
  empresaIdentificacion: string;
  empresaDireccion?: string;
  empresaTelefono?: string;
  empresaCorreo?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<string, string> = {
  FE: "FACTURA ELECTRÓNICA", TE: "TIQUETE ELECTRÓNICO", ND: "NOTA DE DÉBITO",
  NC: "NOTA DE CRÉDITO", FEC: "FACTURA DE COMPRA", REP: "RECIBO DE PAGO", NORMAL: "FACTURA LOCAL",
};

const PAGO_LABELS: Record<string, string> = {
  CONTADO: "Contado", CREDITO: "Crédito", TRANSFERENCIA: "Transferencia",
  SINPE_MOVIL: "SINPE Móvil", TARJETA: "Tarjeta", PLATAFORMA_DIGITAL: "Digital",
};

const IVA_LABELS: Record<string, string> = {
  EXENTO: "Exento", IVA_0_SIN_CREDITO: "0% (sin crédito)",
  IVA_1: "1%", IVA_2: "2%", IVA_4: "4%", IVA_8: "8%", IVA_13: "13%",
};

function fmt(valor: string | number, decimals = 2): string {
  const n = typeof valor === "string" ? parseFloat(valor) : valor;
  return n.toLocaleString("es-CR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ─── Componente PDF ───────────────────────────────────────────────────────────

export function FacturaPDF({ data }: { data: FacturaPDFData }) {
  const tipoLabel = TIPO_LABELS[data.tipoComprobante] ?? data.tipoComprobante;
  const fechaStr = data.fecha.toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const moneda = data.moneda === "USD" ? "$" : "₡";

  return (
    <Document title={tipoLabel} author={data.empresaNombre}>
      <Page size="A4" style={S.page}>
        {/* Encabezado */}
        <View style={S.header}>
          <View style={S.empresa}>
            <Text style={S.empresaNombre}>{data.empresaNombre}</Text>
            <Text style={S.empresaSub}>{data.empresaIdentificacion}</Text>
            {data.empresaTelefono && <Text style={S.empresaSub}>Tel: {data.empresaTelefono}</Text>}
            {data.empresaCorreo && <Text style={S.empresaSub}>{data.empresaCorreo}</Text>}
          </View>
          <View style={S.tipoDoc}>
            <Text style={S.tipoDocLabel}>{tipoLabel}</Text>
            <Text style={S.consecutivoText}>{data.consecutivo ?? "—"}</Text>
            <Text style={S.consecutivoText}>{fechaStr}</Text>
          </View>
        </View>
        <View style={S.hrOrange} />

        {/* Clave numérica */}
        {data.claveNumerica && (
          <View style={S.claveBox}>
            <Text style={S.claveLabel}>Clave numérica</Text>
            <Text style={S.claveValue}>{data.claveNumerica}</Text>
          </View>
        )}

        {/* Emisor / Receptor */}
        <View style={S.row2}>
          <View style={S.card}>
            <Text style={S.cardLabel}>Receptor</Text>
            <Text style={S.cardValue}>{data.clienteNombre}</Text>
          </View>
          <View style={S.card}>
            <Text style={S.cardLabel}>Condición de pago</Text>
            <Text style={S.cardValue}>{PAGO_LABELS[data.tipoPago] ?? data.tipoPago}</Text>
            <Text style={S.cardSub}>Moneda: {data.moneda}</Text>
          </View>
        </View>

        <View style={S.hr} />

        {/* Tabla de líneas */}
        <View style={S.tableHeader}>
          <Text style={[S.tableHeaderText, S.colDesc]}>Descripción</Text>
          <Text style={[S.tableHeaderText, S.colQty]}>Cant.</Text>
          <Text style={[S.tableHeaderText, S.colUnit]}>Unid.</Text>
          <Text style={[S.tableHeaderText, S.colPrice]}>P. Unit.</Text>
          <Text style={[S.tableHeaderText, S.colIva]}>IVA</Text>
          <Text style={[S.tableHeaderText, S.colTotal]}>Total</Text>
        </View>

        {data.lineas.map((l, i) => (
          <View key={l.id} style={[S.tableRow, i % 2 === 1 ? S.tableRowAlt : {}]}>
            <Text style={[S.cellText, S.colDesc]}>{l.descripcion}</Text>
            <Text style={[S.cellText, S.colQty]}>{parseFloat(l.cantidad).toFixed(2)}</Text>
            <Text style={[S.cellText, S.colUnit]}>{l.unidadMedida}</Text>
            <Text style={[S.cellText, S.colPrice]}>{moneda}{fmt(l.precioUnitario, 2)}</Text>
            <Text style={[S.cellText, S.colIva]}>{IVA_LABELS[l.tipoImpuesto] ?? l.tipoImpuesto}</Text>
            <Text style={[S.cellTextBold, S.colTotal]}>{moneda}{fmt(l.totalLinea, 2)}</Text>
          </View>
        ))}

        {/* Totales */}
        <View style={S.totalesBox}>
          <View style={S.totalesInner}>
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>Subtotal</Text>
              <Text style={S.totalValue}>{moneda}{fmt(data.subtotal)}</Text>
            </View>
            {parseFloat(data.descuento) > 0 && (
              <View style={S.totalRow}>
                <Text style={S.totalLabel}>Descuento</Text>
                <Text style={S.totalValue}>-{moneda}{fmt(data.descuento)}</Text>
              </View>
            )}
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>IVA</Text>
              <Text style={S.totalValue}>{moneda}{fmt(data.impuesto)}</Text>
            </View>
            <View style={S.totalFinalRow}>
              <Text style={S.totalFinalLabel}>TOTAL {data.moneda}</Text>
              <Text style={S.totalFinalValue}>{moneda}{fmt(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* Footer normativa */}
        <View style={S.footer}>
          <View style={S.hr} />
          <Text style={S.footerText}>
            Comprobante emitido bajo la Resolución MH-DGT-RES-0021-2022 — Ministerio de Hacienda, Costa Rica
          </Text>
        </View>
      </Page>
    </Document>
  );
}
