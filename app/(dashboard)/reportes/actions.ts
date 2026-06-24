"use server";

import { getSession } from "@/lib/session";
import Decimal from "decimal.js";

// ─── Shared types ──────────────────────────────────────────────────────────────

export interface ReporteRow {
  [key: string]: string | number | null;
}

export interface Columna {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  format?: "currency" | "number" | "integer" | "date" | "text" | "pct";
}

export interface ReporteData {
  titulo: string;
  descripcion?: string;
  columnas: Columna[];
  filas: ReporteRow[];
  totales?: ReporteRow;
  notas?: string;
}

export interface FiltrosReporte {
  desde?: string;
  hasta?: string;
  rutaId?: string;
  vendedorId?: string;
}

// ─── Mock data (compartido entre reportes) ────────────────────────────────────

const FACTURAS_MOCK = [
  { id: "f1", fecha: new Date("2026-06-20"), tipo: "FE", consecutivo: "00100100101000000001", cliente: "Supermercado El Maíz S.A.", rutaId: "r1", vendedorId: "u1", subtotal: 3500, descuento: 0, impuesto: 455, total: 3955, estado: "ACTIVA", estadoMH: "ACEPTADA", tipoPago: "CONTADO" },
  { id: "f2", fecha: new Date("2026-06-21"), tipo: "TE", consecutivo: "00100100400000000002", cliente: "Consumidor Final", rutaId: null, vendedorId: "u2", subtotal: 900, descuento: 0, impuesto: 0, total: 900, estado: "ACTIVA", estadoMH: "ACEPTADA", tipoPago: "CONTADO" },
  { id: "f3", fecha: new Date("2026-06-22"), tipo: "FE", consecutivo: "00100100101000000003", cliente: "Distribuidora Norte S.R.L.", rutaId: "r1", vendedorId: "u1", subtotal: 18500, descuento: 0, impuesto: 0, total: 18500, estado: "ACTIVA", estadoMH: "PENDIENTE", tipoPago: "CREDITO" },
  { id: "f4", fecha: new Date("2026-06-23"), tipo: "NORMAL", consecutivo: null, cliente: "María González Rodríguez", rutaId: "r2", vendedorId: "u2", subtotal: 11000, descuento: 550, impuesto: 441, total: 10891, estado: "ACTIVA", estadoMH: "NO_APLICA", tipoPago: "CONTADO" },
  { id: "f5", fecha: new Date("2026-05-15"), tipo: "FE", consecutivo: "00100100101000000005", cliente: "Supermercado El Maíz S.A.", rutaId: "r1", vendedorId: "u1", subtotal: 45000, descuento: 0, impuesto: 5850, total: 50850, estado: "ACTIVA", estadoMH: "ACEPTADA", tipoPago: "CREDITO" },
  { id: "f6", fecha: new Date("2026-05-28"), tipo: "FE", consecutivo: "00100100101000000006", cliente: "Distribuidora Norte S.R.L.", rutaId: "r1", vendedorId: "u1", subtotal: 32000, descuento: 1000, impuesto: 1020, total: 32020, estado: "ACTIVA", estadoMH: "ACEPTADA", tipoPago: "CONTADO" },
  { id: "f7", fecha: new Date("2026-04-10"), tipo: "FE", consecutivo: "00100100101000000007", cliente: "María González Rodríguez", rutaId: "r2", vendedorId: "u2", subtotal: 8500, descuento: 0, impuesto: 1105, total: 9605, estado: "ACTIVA", estadoMH: "ACEPTADA", tipoPago: "CONTADO" },
];

const LINEAS_MOCK = [
  { facturaId: "f1", producto: "Leche entera 1L", cabys: "1010100010100", unidad: "Unid", cantidad: 3, precioUnit: 1000, descuento: 0, tipoIVA: "IVA_13", tarifa: 13, baseImponible: 3000, montoIVA: 390, total: 3390 },
  { facturaId: "f1", producto: "Queso turrialba 500g", cabys: "1020200020200", unidad: "Unid", cantidad: 1, precioUnit: 500, descuento: 0, tipoIVA: "EXENTO", tarifa: 0, baseImponible: 0, montoIVA: 0, total: 500 },
  { facturaId: "f1", producto: "Carne res kg", cabys: "0310100030100", unidad: "kg", cantidad: 2, precioUnit: 2000, descuento: 200, tipoIVA: "IVA_2", tarifa: 2, baseImponible: 3800, montoIVA: 76, total: 3876 },
  { facturaId: "f2", producto: "Leche descremada 1L", cabys: "1010100010100", unidad: "Unid", cantidad: 9, precioUnit: 100, descuento: 0, tipoIVA: "EXENTO", tarifa: 0, baseImponible: 0, montoIVA: 0, total: 900 },
  { facturaId: "f3", producto: "Servicio de distribución", cabys: "5050500050500", unidad: "Sp", cantidad: 1, precioUnit: 18500, descuento: 0, tipoIVA: "EXENTO", tarifa: 0, baseImponible: 0, montoIVA: 0, total: 18500 },
  { facturaId: "f4", producto: "Carne molida 1kg", cabys: "0310100030100", unidad: "kg", cantidad: 10, precioUnit: 1100, descuento: 550, tipoIVA: "IVA_2", tarifa: 2, baseImponible: 10450, montoIVA: 209, total: 10659 },
  { facturaId: "f5", producto: "Leche entera 1L", cabys: "1010100010100", unidad: "Unid", cantidad: 30, precioUnit: 1000, descuento: 0, tipoIVA: "IVA_13", tarifa: 13, baseImponible: 30000, montoIVA: 3900, total: 33900 },
  { facturaId: "f5", producto: "Mantequilla 500g", cabys: "1030300030300", unidad: "Unid", cantidad: 10, precioUnit: 1000, descuento: 0, tipoIVA: "IVA_13", tarifa: 13, baseImponible: 10000, montoIVA: 1300, total: 11300 },
  { facturaId: "f5", producto: "Queso turrialba 500g", cabys: "1020200020200", unidad: "Unid", cantidad: 10, precioUnit: 500, descuento: 0, tipoIVA: "EXENTO", tarifa: 0, baseImponible: 0, montoIVA: 0, total: 5000 },
  { facturaId: "f6", producto: "Carne res kg", cabys: "0310100030100", unidad: "kg", cantidad: 15, precioUnit: 2000, descuento: 500, tipoIVA: "IVA_2", tarifa: 2, baseImponible: 29500, montoIVA: 590, total: 30090 },
  { facturaId: "f6", producto: "Leche descremada 1L", cabys: "1010100010100", unidad: "Unid", cantidad: 10, precioUnit: 100, descuento: 0, tipoIVA: "EXENTO", tarifa: 0, baseImponible: 0, montoIVA: 0, total: 1000 },
  { facturaId: "f7", producto: "Leche entera 1L", cabys: "1010100010100", unidad: "Unid", cantidad: 5, precioUnit: 1000, descuento: 0, tipoIVA: "IVA_13", tarifa: 13, baseImponible: 5000, montoIVA: 650, total: 5650 },
  { facturaId: "f7", producto: "Queso turrialba 500g", cabys: "1020200020200", unidad: "Unid", cantidad: 7, precioUnit: 500, descuento: 0, tipoIVA: "EXENTO", tarifa: 0, baseImponible: 0, montoIVA: 0, total: 3500 },
  { facturaId: "f7", producto: "Carne molida 1kg", cabys: "0310100030100", unidad: "kg", cantidad: 1, precioUnit: 455, descuento: 0, tipoIVA: "IVA_2", tarifa: 2, baseImponible: 455, montoIVA: 9.1, total: 464.1 },
];

const CLIENTES_MOCK = [
  { id: "c1", codigo: "SMAI001", nombre: "Supermercado El Maíz S.A.", tipo: "JURIDICA", telefono: "22345678", correo: "compras@elmaiz.cr", rutaId: "r1", ruta: "Ruta Norte", tieneCredito: true, diasCredito: 30, limiteCredito: 500000, activo: true },
  { id: "c2", codigo: "PLE001", nombre: "María González Rodríguez", tipo: "FISICA", telefono: "88765432", correo: "mariagonzalez@gmail.com", rutaId: "r2", ruta: "Ruta Sur", tieneCredito: false, diasCredito: 0, limiteCredito: 0, activo: true },
  { id: "c3", codigo: "DN001", nombre: "Distribuidora Norte S.R.L.", tipo: "JURIDICA", telefono: "22556677", correo: "info@distrinorte.cr", rutaId: "r1", ruta: "Ruta Norte", tieneCredito: true, diasCredito: 60, limiteCredito: 1000000, activo: true },
  { id: "c4", codigo: null, nombre: "Consumidor Final", tipo: "GENERICO", telefono: null, correo: null, rutaId: null, ruta: null, tieneCredito: false, diasCredito: 0, limiteCredito: 0, activo: true },
  { id: "c5", codigo: "LDV001", nombre: "Lácteos del Valle S.A.", tipo: "JURIDICA", telefono: "22889900", correo: "admin@lacteosvalle.cr", rutaId: null, ruta: null, tieneCredito: true, diasCredito: 30, limiteCredito: 750000, activo: false },
];

const PRODUCTOS_MOCK = [
  { id: "p1", codigo: "LEC001", nombre: "Leche entera 1L", cabys: "1010100010100", unidad: "Unid", precioCosto: 650, precioVenta: 1000, iva: "IVA_13", stock: 120, stockMin: 20 },
  { id: "p2", codigo: "QUE001", nombre: "Queso turrialba 500g", cabys: "1020200020200", unidad: "Unid", precioCosto: 320, precioVenta: 500, iva: "EXENTO", stock: 45, stockMin: 10 },
  { id: "p3", codigo: "CAR001", nombre: "Carne res kg", cabys: "0310100030100", unidad: "kg", precioCosto: 1400, precioVenta: 2000, iva: "IVA_2", stock: 80, stockMin: 15 },
  { id: "p4", codigo: "LCD001", nombre: "Leche descremada 1L", cabys: "1010100010100", unidad: "Unid", precioCosto: 600, precioVenta: 900, iva: "EXENTO", stock: 5, stockMin: 20 },
  { id: "p5", codigo: "MAN001", nombre: "Mantequilla 500g", cabys: "1030300030300", unidad: "Unid", precioCosto: 700, precioVenta: 1100, iva: "IVA_13", stock: 30, stockMin: 10 },
  { id: "p6", codigo: "CAM001", nombre: "Carne molida 1kg", cabys: "0310100030100", unidad: "kg", precioCosto: 1200, precioVenta: 1600, iva: "IVA_2", stock: 0, stockMin: 10 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyFiltros<T extends { fecha?: Date; rutaId?: string | null; vendedorId?: string }>(
  rows: T[],
  f: FiltrosReporte
): T[] {
  return rows.filter((r) => {
    if (f.desde && r.fecha && r.fecha < new Date(f.desde)) return false;
    if (f.hasta && r.fecha) {
      const h = new Date(f.hasta); h.setHours(23, 59, 59, 999);
      if (r.fecha > h) return false;
    }
    if (f.rutaId && r.rutaId !== f.rutaId) return false;
    if (f.vendedorId && r.vendedorId !== f.vendedorId) return false;
    return true;
  });
}

function mesLabel(d: Date) {
  return d.toLocaleDateString("es-CR", { month: "long", year: "numeric" });
}

function fmt(n: number): string {
  return new Decimal(n).toDecimalPlaces(2).toNumber().toLocaleString("es-CR", { minimumFractionDigits: 2 });
}

// ─── 1. Ventas Mensuales ──────────────────────────────────────────────────────

export async function reporteVentasMensual(filtros: FiltrosReporte): Promise<ReporteData> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  const data = applyFiltros(FACTURAS_MOCK, filtros);

  // Group by month
  const byMes = new Map<string, { count: number; subtotal: number; descuento: number; impuesto: number; total: number }>();
  for (const f of data) {
    const key = `${f.fecha.getFullYear()}-${String(f.fecha.getMonth() + 1).padStart(2, "0")}`;
    const e = byMes.get(key) ?? { count: 0, subtotal: 0, descuento: 0, impuesto: 0, total: 0 };
    e.count++; e.subtotal += f.subtotal; e.descuento += f.descuento; e.impuesto += f.impuesto; e.total += f.total;
    byMes.set(key, e);
  }

  const filas: ReporteRow[] = [...byMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => {
      const [y, m] = key.split("-");
      const d = new Date(Number(y), Number(m) - 1, 1);
      return { mes: mesLabel(d), comprobantes: v.count, subtotal: v.subtotal, descuento: v.descuento, iva: v.impuesto, total: v.total };
    });

  const tot = filas.reduce((a, r) => ({
    mes: "TOTAL", comprobantes: Number(a.comprobantes) + Number(r.comprobantes),
    subtotal: Number(a.subtotal) + Number(r.subtotal), descuento: Number(a.descuento) + Number(r.descuento),
    iva: Number(a.iva) + Number(r.iva), total: Number(a.total) + Number(r.total),
  }), { mes: "TOTAL", comprobantes: 0, subtotal: 0, descuento: 0, iva: 0, total: 0 });

  return {
    titulo: "Ventas Mensuales",
    columnas: [
      { key: "mes", label: "Mes", format: "text" },
      { key: "comprobantes", label: "Comprobantes", align: "right", format: "integer" },
      { key: "subtotal", label: "Subtotal", align: "right", format: "currency" },
      { key: "descuento", label: "Descuento", align: "right", format: "currency" },
      { key: "iva", label: "IVA", align: "right", format: "currency" },
      { key: "total", label: "Total", align: "right", format: "currency" },
    ],
    filas,
    totales: tot,
  };
}

// ─── 2. Ventas Mensuales Detalladas ──────────────────────────────────────────

export async function reporteVentasDetallado(filtros: FiltrosReporte): Promise<ReporteData> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  const data = applyFiltros(FACTURAS_MOCK, filtros);
  const total = data.reduce((a, f) => a + f.total, 0);

  return {
    titulo: "Ventas Mensuales Detalladas",
    columnas: [
      { key: "fecha", label: "Fecha", format: "date" },
      { key: "tipo", label: "Tipo", format: "text" },
      { key: "consecutivo", label: "Consecutivo", format: "text" },
      { key: "cliente", label: "Cliente", format: "text" },
      { key: "tipoPago", label: "Pago", format: "text" },
      { key: "subtotal", label: "Subtotal", align: "right", format: "currency" },
      { key: "descuento", label: "Desc.", align: "right", format: "currency" },
      { key: "iva", label: "IVA", align: "right", format: "currency" },
      { key: "total", label: "Total", align: "right", format: "currency" },
      { key: "estadoMH", label: "MH", align: "center", format: "text" },
    ],
    filas: data.map((f) => ({
      fecha: f.fecha.toLocaleDateString("es-CR"),
      tipo: f.tipo,
      consecutivo: f.consecutivo ? f.consecutivo.slice(-8) : "—",
      cliente: f.cliente,
      tipoPago: f.tipoPago,
      subtotal: f.subtotal,
      descuento: f.descuento,
      iva: f.impuesto,
      total: f.total,
      estadoMH: f.estadoMH,
    })),
    totales: { fecha: "TOTAL", tipo: "", consecutivo: "", cliente: "", tipoPago: "", subtotal: data.reduce((a, f) => a + f.subtotal, 0), descuento: data.reduce((a, f) => a + f.descuento, 0), iva: data.reduce((a, f) => a + f.impuesto, 0), total, estadoMH: "" },
  };
}

// ─── 3. Compras Mensuales ─────────────────────────────────────────────────────

export async function reporteComprasMensual(_filtros: FiltrosReporte): Promise<ReporteData> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  return {
    titulo: "Compras Mensuales",
    descripcion: "No hay compras registradas en el período.",
    columnas: [
      { key: "mes", label: "Mes", format: "text" },
      { key: "facturas", label: "Facturas de Compra", align: "right", format: "integer" },
      { key: "subtotal", label: "Subtotal", align: "right", format: "currency" },
      { key: "iva", label: "IVA", align: "right", format: "currency" },
      { key: "total", label: "Total", align: "right", format: "currency" },
    ],
    filas: [],
    totales: { mes: "TOTAL", facturas: 0, subtotal: 0, iva: 0, total: 0 },
    notas: "Módulo de compras pendiente de implementar.",
  };
}

// ─── 4. Clientes ──────────────────────────────────────────────────────────────

export async function reporteClientes(filtros: FiltrosReporte): Promise<ReporteData> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  const data = filtros.rutaId
    ? CLIENTES_MOCK.filter((c) => c.rutaId === filtros.rutaId)
    : CLIENTES_MOCK;

  return {
    titulo: "Clientes",
    columnas: [
      { key: "codigo", label: "Código", format: "text" },
      { key: "nombre", label: "Nombre", format: "text" },
      { key: "tipo", label: "Tipo ID", format: "text" },
      { key: "telefono", label: "Teléfono", format: "text" },
      { key: "correo", label: "Correo", format: "text" },
      { key: "ruta", label: "Ruta", format: "text" },
      { key: "credito", label: "Crédito", align: "center", format: "text" },
      { key: "activo", label: "Activo", align: "center", format: "text" },
    ],
    filas: data.map((c) => ({
      codigo: c.codigo ?? "—",
      nombre: c.nombre,
      tipo: c.tipo,
      telefono: c.telefono ?? "—",
      correo: c.correo ?? "—",
      ruta: c.ruta ?? "—",
      credito: c.tieneCredito ? `${c.diasCredito}d / ₡${c.limiteCredito.toLocaleString()}` : "No",
      activo: c.activo ? "Sí" : "No",
    })),
  };
}

// ─── 5. Créditos ──────────────────────────────────────────────────────────────

export async function reporteCreditos(filtros: FiltrosReporte): Promise<ReporteData> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  const clientesConCredito = CLIENTES_MOCK.filter((c) => c.tieneCredito);
  const data = filtros.rutaId
    ? clientesConCredito.filter((c) => c.rutaId === filtros.rutaId)
    : clientesConCredito;

  // Simulate outstanding balance from CREDITO payment type facturas
  const facturasCreditoByCliente = FACTURAS_MOCK
    .filter((f) => f.tipoPago === "CREDITO" && f.estado === "ACTIVA")
    .reduce<Record<string, number>>((acc, f) => {
      const key = f.cliente;
      acc[key] = (acc[key] ?? 0) + f.total;
      return acc;
    }, {});

  const today = new Date();

  return {
    titulo: "Créditos Vigentes",
    columnas: [
      { key: "cliente", label: "Cliente", format: "text" },
      { key: "ruta", label: "Ruta", format: "text" },
      { key: "limiteCredito", label: "Límite", align: "right", format: "currency" },
      { key: "saldo", label: "Saldo Pendiente", align: "right", format: "currency" },
      { key: "diasCredito", label: "Días Crédito", align: "right", format: "integer" },
      { key: "diasVencidos", label: "Días Vencidos", align: "right", format: "integer" },
      { key: "estado", label: "Estado", align: "center", format: "text" },
    ],
    filas: data.map((c) => {
      const saldo = facturasCreditoByCliente[c.nombre] ?? 0;
      const diasVencidos = saldo > 0 ? Math.max(0, Math.floor((today.getTime() - new Date("2026-06-22").getTime()) / 86400000) - c.diasCredito) : 0;
      return {
        cliente: c.nombre,
        ruta: c.ruta ?? "—",
        limiteCredito: c.limiteCredito,
        saldo,
        diasCredito: c.diasCredito,
        diasVencidos,
        estado: diasVencidos > 0 ? "VENCIDO" : saldo > 0 ? "VIGENTE" : "AL DÍA",
      };
    }),
    totales: {
      cliente: "TOTAL",
      ruta: "",
      limiteCredito: data.reduce((a, c) => a + c.limiteCredito, 0),
      saldo: data.reduce((a, c) => a + (facturasCreditoByCliente[c.nombre] ?? 0), 0),
      diasCredito: "",
      diasVencidos: "",
      estado: "",
    },
    notas: "Saldo pendiente estimado a partir de facturas a crédito activas.",
  };
}

// ─── 6. Inventario Vendido ────────────────────────────────────────────────────

export async function reporteInventarioVendido(filtros: FiltrosReporte): Promise<ReporteData> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  const factFiltradas = applyFiltros(FACTURAS_MOCK, filtros);
  const idsValidos = new Set(factFiltradas.map((f) => f.id));
  const lineas = LINEAS_MOCK.filter((l) => idsValidos.has(l.facturaId));

  // Group by product
  const byProd = new Map<string, { cabys: string; unidad: string; cantidad: number; totalVenta: number }>();
  for (const l of lineas) {
    const e = byProd.get(l.producto) ?? { cabys: l.cabys, unidad: l.unidad, cantidad: 0, totalVenta: 0 };
    e.cantidad += l.cantidad;
    e.totalVenta += l.total;
    byProd.set(l.producto, e);
  }

  const filas = [...byProd.entries()]
    .sort(([, a], [, b]) => b.totalVenta - a.totalVenta)
    .map(([prod, v]) => ({
      producto: prod,
      cabys: v.cabys,
      unidad: v.unidad,
      cantidad: v.cantidad,
      totalVenta: v.totalVenta,
    }));

  return {
    titulo: "Inventario Vendido",
    columnas: [
      { key: "producto", label: "Producto", format: "text" },
      { key: "cabys", label: "CABYS", format: "text" },
      { key: "unidad", label: "Unidad", align: "center", format: "text" },
      { key: "cantidad", label: "Cantidad", align: "right", format: "number" },
      { key: "totalVenta", label: "Total Vendido", align: "right", format: "currency" },
    ],
    filas,
    totales: { producto: "TOTAL", cabys: "", unidad: "", cantidad: filas.reduce((a, r) => a + Number(r.cantidad), 0), totalVenta: filas.reduce((a, r) => a + Number(r.totalVenta), 0) },
  };
}

// ─── 7. Inventario Vendido Detallado ─────────────────────────────────────────

export async function reporteInventarioVendidoDetallado(filtros: FiltrosReporte): Promise<ReporteData> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  const factFiltradas = applyFiltros(FACTURAS_MOCK, filtros);
  const factByid = new Map(factFiltradas.map((f) => [f.id, f]));

  const filas = LINEAS_MOCK
    .filter((l) => factByid.has(l.facturaId))
    .map((l) => {
      const f = factByid.get(l.facturaId)!;
      return {
        fecha: f.fecha.toLocaleDateString("es-CR"),
        consecutivo: f.consecutivo ? f.consecutivo.slice(-8) : "—",
        cliente: f.cliente,
        producto: l.producto,
        unidad: l.unidad,
        cantidad: l.cantidad,
        precioUnit: l.precioUnit,
        descuento: l.descuento,
        total: l.total,
      };
    });

  return {
    titulo: "Inventario Vendido Detallado",
    columnas: [
      { key: "fecha", label: "Fecha", format: "text" },
      { key: "consecutivo", label: "Consec.", format: "text" },
      { key: "cliente", label: "Cliente", format: "text" },
      { key: "producto", label: "Producto", format: "text" },
      { key: "unidad", label: "Unid.", align: "center", format: "text" },
      { key: "cantidad", label: "Cant.", align: "right", format: "number" },
      { key: "precioUnit", label: "P.Unit", align: "right", format: "currency" },
      { key: "descuento", label: "Desc.", align: "right", format: "currency" },
      { key: "total", label: "Total", align: "right", format: "currency" },
    ],
    filas,
    totales: { fecha: "TOTAL", consecutivo: "", cliente: "", producto: "", unidad: "", cantidad: filas.reduce((a, r) => a + Number(r.cantidad), 0), precioUnit: "", descuento: filas.reduce((a, r) => a + Number(r.descuento), 0), total: filas.reduce((a, r) => a + Number(r.total), 0) },
  };
}

// ─── 8. Precios de Inventario ─────────────────────────────────────────────────

export async function reportePrecios(_filtros: FiltrosReporte): Promise<ReporteData> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  const IVA_LABELS: Record<string, string> = {
    EXENTO: "Exento", IVA_0_SIN_CREDITO: "0%*", IVA_1: "1%", IVA_2: "2%",
    IVA_4: "4%", IVA_8: "8%", IVA_13: "13%",
  };

  return {
    titulo: "Precios de Inventario",
    columnas: [
      { key: "codigo", label: "Código", format: "text" },
      { key: "nombre", label: "Nombre", format: "text" },
      { key: "cabys", label: "CABYS", format: "text" },
      { key: "unidad", label: "Unidad", align: "center", format: "text" },
      { key: "precioCosto", label: "P.Costo", align: "right", format: "currency" },
      { key: "precioVenta", label: "P.Venta", align: "right", format: "currency" },
      { key: "iva", label: "IVA", align: "center", format: "text" },
      { key: "stock", label: "Stock", align: "right", format: "integer" },
      { key: "stockMin", label: "Stock Mín.", align: "right", format: "integer" },
      { key: "alerta", label: "", align: "center", format: "text" },
    ],
    filas: PRODUCTOS_MOCK.map((p) => ({
      codigo: p.codigo,
      nombre: p.nombre,
      cabys: p.cabys,
      unidad: p.unidad,
      precioCosto: p.precioCosto,
      precioVenta: p.precioVenta,
      iva: IVA_LABELS[p.iva] ?? p.iva,
      stock: p.stock,
      stockMin: p.stockMin,
      alerta: p.stock <= p.stockMin ? "⚠ Stock bajo" : "",
    })),
  };
}

// ─── 9. Ventas por Impuestos (Formulario 150 TRIBU-CR) ────────────────────────

export async function reporteImpuestosVentas(filtros: FiltrosReporte): Promise<ReporteData> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  const factFiltradas = applyFiltros(FACTURAS_MOCK, filtros);
  const idsValidos = new Set(factFiltradas.map((f) => f.id));
  const lineas = LINEAS_MOCK.filter((l) => idsValidos.has(l.facturaId));

  // Group by tarifa IVA — aligned with F-150 TRIBU-CR
  const TARIFAS = [
    { key: "EXENTO", label: "Exento (0%)", tarifa: 0 },
    { key: "IVA_1", label: "Tarifa reducida especial 1%", tarifa: 1 },
    { key: "IVA_2", label: "Tarifa reducida 2%", tarifa: 2 },
    { key: "IVA_4", label: "Tarifa reducida 4%", tarifa: 4 },
    { key: "IVA_8", label: "Tarifa reducida especial 8%", tarifa: 8 },
    { key: "IVA_13", label: "Tarifa general 13%", tarifa: 13 },
    { key: "IVA_0_SIN_CREDITO", label: "Tarifa 0% sin crédito (cód. 11)", tarifa: 0 },
  ];

  const byTarifa = new Map<string, { base: number; iva: number; total: number }>();
  for (const l of lineas) {
    const tipo = l.tipoIVA;
    const e = byTarifa.get(tipo) ?? { base: 0, iva: 0, total: 0 };
    e.base += l.baseImponible;
    e.iva += l.montoIVA;
    e.total += l.total;
    byTarifa.set(tipo, e);
  }

  const filas = TARIFAS
    .filter((t) => byTarifa.has(t.key))
    .map((t) => {
      const v = byTarifa.get(t.key)!;
      return {
        tarifa: t.label,
        pct: t.tarifa === 0 ? "0%" : `${t.tarifa}%`,
        base: v.base,
        iva: v.iva,
        total: v.total,
      };
    });

  return {
    titulo: "Ventas por Impuestos",
    descripcion: "Alineado al Formulario D-150 de TRIBU-CR",
    columnas: [
      { key: "tarifa", label: "Categoría IVA", format: "text" },
      { key: "pct", label: "%", align: "center", format: "text" },
      { key: "base", label: "Base Imponible", align: "right", format: "currency" },
      { key: "iva", label: "IVA Cobrado", align: "right", format: "currency" },
      { key: "total", label: "Total", align: "right", format: "currency" },
    ],
    filas,
    totales: {
      tarifa: "TOTAL",
      pct: "",
      base: filas.reduce((a, r) => a + Number(r.base), 0),
      iva: filas.reduce((a, r) => a + Number(r.iva), 0),
      total: filas.reduce((a, r) => a + Number(r.total), 0),
    },
    notas: "Formulario D-150: Declaración Jurada del Impuesto al Valor Agregado. Presentar mensualmente en TRIBU-CR antes del día 15 del mes siguiente.",
  };
}

// ─── 10. Compras por Impuestos ────────────────────────────────────────────────

export async function reporteImpuestosCompras(_filtros: FiltrosReporte): Promise<ReporteData> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  return {
    titulo: "Compras por Impuestos",
    descripcion: "Alineado al Formulario D-150 de TRIBU-CR (sección compras)",
    columnas: [
      { key: "tarifa", label: "Categoría IVA", format: "text" },
      { key: "pct", label: "%", align: "center", format: "text" },
      { key: "base", label: "Base Imponible", align: "right", format: "currency" },
      { key: "iva", label: "IVA Acreditable", align: "right", format: "currency" },
      { key: "total", label: "Total", align: "right", format: "currency" },
    ],
    filas: [],
    totales: { tarifa: "TOTAL", pct: "", base: 0, iva: 0, total: 0 },
    notas: "Sin compras registradas. Módulo de compras pendiente de implementar.",
  };
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export async function obtenerReporte(tipo: string, filtros: FiltrosReporte): Promise<ReporteData | null> {
  switch (tipo) {
    case "ventas-mensual": return reporteVentasMensual(filtros);
    case "ventas-detallado": return reporteVentasDetallado(filtros);
    case "compras-mensual": return reporteComprasMensual(filtros);
    case "clientes": return reporteClientes(filtros);
    case "creditos": return reporteCreditos(filtros);
    case "inventario-vendido": return reporteInventarioVendido(filtros);
    case "inventario-detallado": return reporteInventarioVendidoDetallado(filtros);
    case "precios-inventario": return reportePrecios(filtros);
    case "impuestos-ventas": return reporteImpuestosVentas(filtros);
    case "impuestos-compras": return reporteImpuestosCompras(filtros);
    default: return null;
  }
}

// ─── Exportar Excel ───────────────────────────────────────────────────────────

export async function exportarReporteExcel(tipo: string, filtros: FiltrosReporte): Promise<{ error?: string; base64?: string }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { error: "No autorizado" };

  const reporte = await obtenerReporte(tipo, filtros);
  if (!reporte) return { error: "Reporte no encontrado" };

  try {
    const ExcelJS = await import("exceljs");
    const wb = new ExcelJS.Workbook();
    wb.creator = "SistemaGan";
    wb.created = new Date();

    const ws = wb.addWorksheet(reporte.titulo.slice(0, 31));

    // Title row
    ws.mergeCells(1, 1, 1, reporte.columnas.length);
    ws.getCell("A1").value = reporte.titulo;
    ws.getCell("A1").font = { bold: true, size: 14 };
    ws.getRow(1).height = 22;

    if (reporte.descripcion) {
      ws.mergeCells(2, 1, 2, reporte.columnas.length);
      ws.getCell("A2").value = reporte.descripcion;
      ws.getCell("A2").font = { italic: true, size: 10, color: { argb: "FF666666" } };
    }

    // Filter row
    const filterParts = [];
    if (filtros.desde) filterParts.push(`Desde: ${filtros.desde}`);
    if (filtros.hasta) filterParts.push(`Hasta: ${filtros.hasta}`);
    if (filterParts.length) {
      const filterRow = reporte.descripcion ? 3 : 2;
      ws.mergeCells(filterRow, 1, filterRow, reporte.columnas.length);
      ws.getCell(`A${filterRow}`).value = filterParts.join("  |  ");
      ws.getCell(`A${filterRow}`).font = { size: 9, color: { argb: "FF999999" } };
    }

    const headerRow = ws.addRow(reporte.columnas.map((c) => c.label));
    headerRow.font = { bold: true };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE85D24" } };
    headerRow.eachCell((cell) => { cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; });

    ws.columns = reporte.columnas.map((c) => ({
      key: c.key,
      width: c.format === "text" ? 28 : 14,
    }));

    for (const fila of reporte.filas) {
      const row = ws.addRow(reporte.columnas.map((c) => fila[c.key]));
      row.eachCell((cell, ci) => {
        const col = reporte.columnas[ci - 1];
        if (col?.format === "currency" || col?.format === "number") {
          cell.numFmt = col.format === "currency" ? "#,##0.00" : "#,##0.000";
          cell.alignment = { horizontal: "right" };
        }
        if (col?.align === "right") cell.alignment = { horizontal: "right" };
        if (col?.align === "center") cell.alignment = { horizontal: "center" };
      });
    }

    // Totals row
    if (reporte.totales) {
      const totRow = ws.addRow(reporte.columnas.map((c) => reporte.totales![c.key] ?? ""));
      totRow.font = { bold: true };
      totRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
    }

    if (reporte.notas) {
      ws.addRow([]);
      ws.addRow([`* ${reporte.notas}`]);
    }

    const buffer = await wb.xlsx.writeBuffer();
    return { base64: Buffer.from(buffer).toString("base64") };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
