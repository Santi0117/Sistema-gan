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

      // Encolar envío a Hacienda si es comprobante electrónico
      if (esElectronica && claveNumerica && nuevaFactura.id) {
        try {
          const { encolarEnvioHacienda } = await import("@/infrastructure/hacienda/hacienda-queue");
          await encolarEnvioHacienda(nuevaFactura.id, session.empresaId);
        } catch {
          // Redis no disponible — el operador puede reenviar manualmente
        }
      }

      revalidatePath("/ventas");
      return { facturaId: nuevaFactura.id, claveNumerica: claveNumerica ?? undefined, numero };
    }
  } catch {
    // DB not available — dev mode mock
    console.warn("[DEV] DB no disponible, factura no persistida");
  }

  // Encolar envío a Hacienda si es comprobante electrónico (solo dev fallback)
  if (esElectronica && claveNumerica) {
    try {
      const { encolarEnvioHacienda } = await import("@/infrastructure/hacienda/hacienda-queue");
      await encolarEnvioHacienda(`mock-${Date.now()}`, session.empresaId);
    } catch {
      // Redis no disponible en dev — normal
    }
  }

  revalidatePath("/ventas");
  return {
    facturaId: `mock-${Date.now()}`,
    claveNumerica: claveNumerica ?? undefined,
    numero,
  };
}

// ─── Líneas de factura ────────────────────────────────────────────────────────

export interface LineaFacturaMock {
  id: string;
  facturaId: string;
  linea: number;
  codigoCabys: string | null;
  descripcion: string;
  unidadMedida: string;
  cantidad: string;
  precioUnitario: string;
  descuentoPct: string;
  descuentoMonto: string;
  subtotalLinea: string;
  baseImponible: string;
  tipoImpuesto: string;
  tarifaImpuesto: string;
  montoImpuesto: string;
  totalLinea: string;
}

const MOCK_LINEAS: LineaFacturaMock[] = [
  { id: "l1", facturaId: "f1", linea: 1, codigoCabys: "1010100010100", descripcion: "Leche entera 1L", unidadMedida: "Unid", cantidad: "3.000", precioUnitario: "1000.00000", descuentoPct: "0.00", descuentoMonto: "0.00000", subtotalLinea: "3000.00000", baseImponible: "3000.00000", tipoImpuesto: "IVA_13", tarifaImpuesto: "13.00", montoImpuesto: "390.00000", totalLinea: "3390.00000" },
  { id: "l2", facturaId: "f1", linea: 2, codigoCabys: "1020200020200", descripcion: "Queso turrialba 500g", unidadMedida: "Unid", cantidad: "1.000", precioUnitario: "500.00000", descuentoPct: "0.00", descuentoMonto: "0.00000", subtotalLinea: "500.00000", baseImponible: "0.00000", tipoImpuesto: "EXENTO", tarifaImpuesto: "0.00", montoImpuesto: "0.00000", totalLinea: "500.00000" },
  { id: "l3", facturaId: "f1", linea: 3, codigoCabys: "0310100030100", descripcion: "Carne res kg", unidadMedida: "kg", cantidad: "2.000", precioUnitario: "2000.00000", descuentoPct: "5.00", descuentoMonto: "200.00000", subtotalLinea: "4000.00000", baseImponible: "3800.00000", tipoImpuesto: "IVA_2", tarifaImpuesto: "2.00", montoImpuesto: "76.00000", totalLinea: "3876.00000" },
  { id: "l4", facturaId: "f2", linea: 1, codigoCabys: "1010100010100", descripcion: "Leche descremada 1L", unidadMedida: "Unid", cantidad: "9.000", precioUnitario: "100.00000", descuentoPct: "0.00", descuentoMonto: "0.00000", subtotalLinea: "900.00000", baseImponible: "0.00000", tipoImpuesto: "EXENTO", tarifaImpuesto: "0.00", montoImpuesto: "0.00000", totalLinea: "900.00000" },
  { id: "l5", facturaId: "f3", linea: 1, codigoCabys: "5050500050500", descripcion: "Servicio de distribución", unidadMedida: "Sp", cantidad: "1.000", precioUnitario: "18500.00000", descuentoPct: "0.00", descuentoMonto: "0.00000", subtotalLinea: "18500.00000", baseImponible: "0.00000", tipoImpuesto: "EXENTO", tarifaImpuesto: "0.00", montoImpuesto: "0.00000", totalLinea: "18500.00000" },
  { id: "l6", facturaId: "f4", linea: 1, codigoCabys: "0310100030100", descripcion: "Carne molida 1kg", unidadMedida: "kg", cantidad: "10.000", precioUnitario: "1100.00000", descuentoPct: "5.00", descuentoMonto: "550.00000", subtotalLinea: "11000.00000", baseImponible: "10450.00000", tipoImpuesto: "IVA_2", tarifaImpuesto: "2.00", montoImpuesto: "209.00000", totalLinea: "10659.00000" },
];

export async function obtenerLineasFactura(facturaId: string): Promise<LineaFacturaMock[]> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  try {
    const { db, lineaFactura } = await import("@/infrastructure/db");
    const { eq } = await import("drizzle-orm");
    const lineas = await db.select().from(lineaFactura).where(eq(lineaFactura.facturaId, facturaId));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return lineas as any[];
  } catch {
    return MOCK_LINEAS.filter((l) => l.facturaId === facturaId);
  }
}

// ─── Anular factura → genera NC ───────────────────────────────────────────────

export async function anularFactura(
  facturaId: string,
  razon: string
): Promise<{ error?: string; ncId?: string; ncConsecutivo?: string }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { error: "No autorizado" };
  if (!razon.trim()) return { error: "Debe indicar una razón de anulación" };

  const factura = MOCK_FACTURAS.find((f) => f.id === facturaId);
  if (!factura) return { error: "Factura no encontrada" };
  if (factura.estado !== "ACTIVA") return { error: "Solo se pueden anular facturas activas" };
  if (factura.tipoComprobante === "NC") return { error: "No se puede anular una Nota de Crédito" };

  try {
    const { db, factura: facturaTable } = await import("@/infrastructure/db");
    const { eq } = await import("drizzle-orm");

    // Marcar como ANULADA
    await db.update(facturaTable).set({ estado: "ANULADA" }).where(eq(facturaTable.id, facturaId));

    // Solo facturas electrónicas generan NC electrónica
    const esElectronica = TIPOS_COMPROBANTE_ELECTRONICOS.includes(factura.tipoComprobante);
    let ncConsecutivo: string | null = null;
    let ncClave: string | null = null;

    if (esElectronica && factura.consecutivo && factura.claveNumerica) {
      ncConsecutivo = generarConsecutivo({ tipo: "NC", secuencia: mockSecuencia });
      ncClave = generarClaveNumerica({
        fecha: new Date(),
        identificacionEmisor: "3101000000",
        consecutivo: ncConsecutivo,
      });
      mockSecuencia++;
    }

    const [nc] = await db.insert(facturaTable).values({
      numero: mockSecuencia,
      consecutivo: ncConsecutivo ?? `NC-${Date.now()}`,
      claveNumerica: ncClave,
      tipoComprobante: "NC",
      tipoPago: factura.tipoPago ?? "CONTADO",
      moneda: factura.moneda ?? "CRC",
      tipoCambio: factura.tipoCambio ?? "1.00000",
      fecha: new Date(),
      subtotal: factura.subtotal ?? "0",
      descuento: factura.descuento ?? "0",
      impuesto: factura.impuesto ?? "0",
      total: factura.total ?? "0",
      estado: "ACTIVA",
      estadoMH: esElectronica ? "PENDIENTE" : "NO_APLICA",
      clienteId: factura.clienteId,
      usuarioId: session.userId,
      empresaId: session.empresaId,
      facturaReferenciaId: facturaId,
    }).returning({ id: facturaTable.id });

    if (esElectronica && ncClave && nc?.id) {
      try {
        const { encolarEnvioHacienda } = await import("@/infrastructure/hacienda/hacienda-queue");
        await encolarEnvioHacienda(nc.id, session.empresaId);
      } catch {
        // Redis no disponible en dev
      }
    }

    revalidatePath("/ventas");
    return { ncId: nc?.id ?? "mock-nc", ncConsecutivo: ncConsecutivo ?? undefined };
  } catch (err) {
    console.warn("[DEV] DB no disponible, anulación mock:", (err as Error).message);
    // Mock fallback
    const idx = MOCK_FACTURAS.findIndex((f) => f.id === facturaId);
    if (idx >= 0) MOCK_FACTURAS[idx] = { ...MOCK_FACTURAS[idx], estado: "ANULADA" };
    revalidatePath("/ventas");
    return { ncId: `mock-nc-${Date.now()}`, ncConsecutivo: `NC-MOCK-${facturaId}` };
  }
}

// ─── Reenviar a Hacienda (manual) ─────────────────────────────────────────────

export async function reenviarAHacienda(
  facturaId: string
): Promise<{ error?: string; ok?: boolean }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { error: "No autorizado" };

  const factura = MOCK_FACTURAS.find((f) => f.id === facturaId);
  if (!factura) return { error: "Factura no encontrada" };
  if (!TIPOS_COMPROBANTE_ELECTRONICOS.includes(factura.tipoComprobante)) {
    return { error: "Solo comprobantes electrónicos se envían a Hacienda" };
  }
  if (factura.estadoMH === "ACEPTADA") {
    return { error: "El comprobante ya fue aceptado por Hacienda" };
  }

  try {
    const { encolarEnvioHacienda } = await import("@/infrastructure/hacienda/hacienda-queue");
    await encolarEnvioHacienda(facturaId, session.empresaId);
    return { ok: true };
  } catch (err) {
    return { error: `Redis no disponible: ${(err as Error).message}` };
  }
}

// ─── Refrescar estado MH desde TRIBU-CR ───────────────────────────────────────

export async function refrescarEstadoMH(
  facturaId: string
): Promise<{ error?: string; estadoMH?: string; mensaje?: string }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { error: "No autorizado" };

  try {
    const { db, factura: facturaTable, empresa } = await import("@/infrastructure/db");
    const { eq } = await import("drizzle-orm");

    const [f] = await db.select().from(facturaTable).where(eq(facturaTable.id, facturaId));
    if (!f?.claveNumerica) return { error: "Factura sin clave numérica" };

    const [emp] = await db.select().from(empresa).where(eq(empresa.id, session.empresaId));
    if (!emp?.usuarioTribuCR) return { error: "Configure las credenciales TRIBU-CR primero" };

    const { getHaciendaProvider } = await import("@/infrastructure/hacienda/tribu-cr.provider");
    const { tipoIdAHacienda } = await import("@/domain/hacienda/construir-xml");

    const provider = getHaciendaProvider({
      usuario: emp.usuarioTribuCR,
      clave: emp.claveTribuCR ?? "",
      ambiente: emp.ambienteMH,
      empresaId: emp.id,
      emisorTipoId: tipoIdAHacienda(emp.tipoIdentificacion ?? "JURIDICA") ?? "02",
      emisorNumeroId: emp.identificacion,
    });

    const resultado = await provider.consultarEstado(f.claveNumerica);
    const estadoMH = resultado.estado === "ACEPTADO" ? "ACEPTADA"
      : resultado.estado === "RECHAZADO" ? "RECHAZADA"
      : resultado.estado === "ERROR" ? "ERROR"
      : "EN_PROCESO";

    await db.update(facturaTable)
      .set({ estadoMH, mensajeMH: resultado.mensaje ?? null })
      .where(eq(facturaTable.id, facturaId));

    revalidatePath(`/ventas/${facturaId}`);
    return { estadoMH, mensaje: resultado.mensaje };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

// ─── Exportar Excel ───────────────────────────────────────────────────────────

export async function exportarFacturasExcel(): Promise<{ error?: string; base64?: string }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { error: "No autorizado" };

  const facturas = await obtenerFacturas();

  try {
    const ExcelJS = await import("exceljs");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Comprobantes");

    ws.columns = [
      { header: "Fecha", key: "fecha", width: 12 },
      { header: "Tipo", key: "tipo", width: 20 },
      { header: "Consecutivo", key: "consecutivo", width: 22 },
      { header: "Cliente", key: "cliente", width: 30 },
      { header: "Tipo Pago", key: "pago", width: 15 },
      { header: "Subtotal", key: "subtotal", width: 14 },
      { header: "IVA", key: "iva", width: 14 },
      { header: "Total", key: "total", width: 14 },
      { header: "Estado", key: "estado", width: 12 },
      { header: "Estado MH", key: "estadoMH", width: 12 },
    ];

    ws.getRow(1).font = { bold: true };

    for (const f of facturas) {
      ws.addRow({
        fecha: f.fecha.toLocaleDateString("es-CR"),
        tipo: f.tipoComprobante,
        consecutivo: f.consecutivo ?? "",
        cliente: (f as { clienteNombre?: string }).clienteNombre ?? "",
        pago: f.tipoPago ?? "",
        subtotal: parseFloat(f.subtotal ?? "0"),
        iva: parseFloat(f.impuesto ?? "0"),
        total: parseFloat(f.total ?? "0"),
        estado: f.estado ?? "",
        estadoMH: f.estadoMH ?? "",
      });
    }

    const buffer = await wb.xlsx.writeBuffer();
    return { base64: Buffer.from(buffer).toString("base64") };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
