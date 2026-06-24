"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { calcularTotales, type LineaInput } from "@/domain/facturacion/calcular-totales";
import { generarConsecutivo } from "@/domain/facturacion/consecutivo";
import { generarClaveNumerica } from "@/domain/facturacion/clave-numerica";
import type { TipoComprobante, TipoImpuesto } from "@/domain/facturacion/tipos";
import { TIPOS_COMPROBANTE_ELECTRONICOS } from "@/domain/facturacion/tipos";
import type { Factura } from "@/infrastructure/db/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LineaFacturaInput {
  productoId: string | null;
  codigoCabys: string;
  descripcion: string;
  unidadMedida: string;
  cantidad: string;
  precioUnitario: string;
  descuentoPct: string;
  tipoImpuesto: TipoImpuesto;
}

export interface EmitirFacturaInput {
  tipoComprobante: TipoComprobante;
  tipoPago: string;
  moneda: "CRC" | "USD";
  tipoCambio: string;
  fecha: string;
  clienteId: string | null;
  rutaId?: string | null;
  lineas: LineaFacturaInput[];
  observaciones?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

type MockFactura = Pick<Factura,
  "id" | "consecutivo" | "claveNumerica" | "tipoComprobante" | "tipoPago" |
  "moneda" | "tipoCambio" | "fecha" | "subtotal" | "descuento" | "impuesto" |
  "total" | "estado" | "estadoMH" | "clienteId" | "empresaId" | "createdAt"
> & { clienteNombre?: string };

const MOCK_FACTURAS: MockFactura[] = [
  {
    id: "f1", consecutivo: "00100100101000000001",
    claveNumerica: "50602062631012345678000100100100000000011234567",
    tipoComprobante: "FE", tipoPago: "CONTADO", moneda: "CRC", tipoCambio: "1.00000",
    fecha: new Date("2026-06-20"), subtotal: "3500.00000", descuento: "0.00000",
    impuesto: "455.00000", total: "3955.00000",
    estado: "ACTIVA", estadoMH: "ACEPTADA",
    clienteId: "c1", clienteNombre: "Supermercado El Maíz S.A.",
    empresaId: "dev-empresa", createdAt: new Date("2026-06-20"),
  },
  {
    id: "f2", consecutivo: "00100100400000000002",
    claveNumerica: "50620062631012345678000100100400000000021234567",
    tipoComprobante: "TE", tipoPago: "CONTADO", moneda: "CRC", tipoCambio: "1.00000",
    fecha: new Date("2026-06-21"), subtotal: "900.00000", descuento: "0.00000",
    impuesto: "0.00000", total: "900.00000",
    estado: "ACTIVA", estadoMH: "ACEPTADA",
    clienteId: "c4", clienteNombre: "Consumidor Final",
    empresaId: "dev-empresa", createdAt: new Date("2026-06-21"),
  },
  {
    id: "f3", consecutivo: "00100100101000000003",
    claveNumerica: "50621062631012345678000100100100000000031234567",
    tipoComprobante: "FE", tipoPago: "CREDITO", moneda: "CRC", tipoCambio: "1.00000",
    fecha: new Date("2026-06-22"), subtotal: "18500.00000", descuento: "0.00000",
    impuesto: "0.00000", total: "18500.00000",
    estado: "ACTIVA", estadoMH: "PENDIENTE",
    clienteId: "c3", clienteNombre: "Distribuidora Norte S.R.L.",
    empresaId: "dev-empresa", createdAt: new Date("2026-06-22"),
  },
  {
    id: "f4", consecutivo: "00100100101000000004",
    claveNumerica: null,
    tipoComprobante: "NORMAL", tipoPago: "CONTADO", moneda: "CRC", tipoCambio: "1.00000",
    fecha: new Date("2026-06-23"), subtotal: "11000.00000", descuento: "550.00000",
    impuesto: "441.00000", total: "10891.00000",
    estado: "ACTIVA", estadoMH: "NO_APLICA",
    clienteId: "c2", clienteNombre: "María González Rodríguez",
    empresaId: "dev-empresa", createdAt: new Date("2026-06-23"),
  },
];

let mockSecuencia = 5;

// ─── Obtener lista ─────────────────────────────────────────────────────────────

export async function obtenerFacturas(): Promise<MockFactura[]> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");
  return MOCK_FACTURAS.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export async function obtenerFactura(id: string): Promise<MockFactura | null> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");
  return MOCK_FACTURAS.find((f) => f.id === id) ?? null;
}

// ─── Emitir factura ───────────────────────────────────────────────────────────

export async function emitirFactura(
  input: EmitirFacturaInput
): Promise<{ error?: string; facturaId?: string; claveNumerica?: string; numero?: string }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { error: "No autorizado" };

  if (!input.lineas.length) return { error: "La factura debe tener al menos una línea" };

  // Validate lines
  const lineasInput: LineaInput[] = input.lineas.map((l) => ({
    cantidad: l.cantidad,
    precioUnitario: l.precioUnitario,
    descuentoPct: l.descuentoPct || "0",
    tipoImpuesto: l.tipoImpuesto,
  }));

  let totales;
  try {
    totales = calcularTotales(lineasInput);
  } catch (err) {
    return { error: (err as Error).message };
  }

  const esElectronica = TIPOS_COMPROBANTE_ELECTRONICOS.includes(input.tipoComprobante);
  let consecutivo: string | null = null;
  let claveNumerica: string | null = null;
  let numero: string;

  if (esElectronica) {
    try {
      consecutivo = generarConsecutivo({
        tipo: input.tipoComprobante,
        secuencia: mockSecuencia,
      });
      claveNumerica = generarClaveNumerica({
        fecha: new Date(input.fecha),
        identificacionEmisor: "3101000000",
        consecutivo,
      });
      numero = consecutivo;
      mockSecuencia++;
    } catch (err) {
      return { error: `Error generando clave: ${(err as Error).message}` };
    }
  } else {
    numero = String(mockSecuencia++).padStart(10, "0");
  }

  const estadoMH = esElectronica ? "PENDIENTE" : "NO_APLICA";

  type TipoPagoEnum =
    | "CONTADO" | "CREDITO" | "TRANSFERENCIA"
    | "SINPE_MOVIL" | "TARJETA" | "PLATAFORMA_DIGITAL";

  const VALID_PAGO: TipoPagoEnum[] = [
    "CONTADO","CREDITO","TRANSFERENCIA","SINPE_MOVIL","TARJETA","PLATAFORMA_DIGITAL",
  ];
  const tipoPagoSafe = (VALID_PAGO.includes(input.tipoPago as TipoPagoEnum)
    ? input.tipoPago : "CONTADO") as TipoPagoEnum;

  try {
    const { db, factura, lineaFactura } = await import("@/infrastructure/db");

    const [nuevaFactura] = await db
      .insert(factura)
      .values({
        numero: mockSecuencia - 1,
        consecutivo: (consecutivo ?? numero).padStart(20, "0"),
        claveNumerica,
        tipoComprobante: input.tipoComprobante,
        tipoPago: tipoPagoSafe,
        moneda: input.moneda,
        tipoCambio: input.tipoCambio,
        fecha: new Date(input.fecha),
        subtotal: totales.subtotal.toFixed(5),
        descuento: totales.descuento.toFixed(5),
        impuesto: totales.totalImpuesto.toFixed(5),
        total: totales.total.toFixed(5),
        estado: "ACTIVA",
        estadoMH,
        clienteId: input.clienteId || null,
        rutaId: input.rutaId || null,
        usuarioId: session.userId,
        empresaId: session.empresaId,
      })
      .returning({ id: factura.id });

    // Insert lines
    if (nuevaFactura?.id) {
      for (let i = 0; i < input.lineas.length; i++) {
        const linea = input.lineas[i];
        const lineaCalc = totales.lineas[i];
        await db.insert(lineaFactura).values({
          facturaId: nuevaFactura.id,
          linea: i + 1,
          productoId: linea.productoId || null,
          codigoCabys: linea.codigoCabys || null,
          descripcion: linea.descripcion,
          unidadMedida: linea.unidadMedida,
          cantidad: lineaCalc.cantidad.toFixed(3),
          precioUnitario: lineaCalc.precioUnitario.toFixed(5),
          descuentoPct: lineaCalc.descuentoPct.toFixed(2),
          descuentoMonto: lineaCalc.descuentoMonto.toFixed(5),
          subtotalLinea: lineaCalc.subtotalLinea.toFixed(5),
          baseImponible: lineaCalc.baseImponible.toFixed(5),
          tipoImpuesto: linea.tipoImpuesto,
          tarifaImpuesto: lineaCalc.tarifaImpuesto.toFixed(2),
          montoImpuesto: lineaCalc.montoImpuesto.toFixed(5),
          totalLinea: lineaCalc.totalLinea.toFixed(5),
        });
      }

      revalidatePath("/ventas");
      return { facturaId: nuevaFactura.id, claveNumerica: claveNumerica ?? undefined, numero };
    }
  } catch {
    // DB not available — dev mode mock
    console.warn("[DEV] DB no disponible, factura no persistida");
  }

  revalidatePath("/ventas");
  return {
    facturaId: `mock-${Date.now()}`,
    claveNumerica: claveNumerica ?? undefined,
    numero,
  };
}
