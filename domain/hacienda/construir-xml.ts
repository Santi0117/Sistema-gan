/**
 * Construye el XML v4.4 de Hacienda Costa Rica desde un objeto factura.
 * Función pura — sin imports de Next.js, React ni Drizzle.
 */

import Decimal from "decimal.js";
import type { TipoComprobante, TipoImpuesto } from "@/domain/facturacion/tipos";
import { CODIGO_HACIENDA_IMPUESTO } from "@/domain/facturacion/tipos";

// ─── Tipos de entrada ─────────────────────────────────────────────────────────

/** Código de tipo de identificación para el XML de Hacienda */
export type TipoIdHacienda = "01" | "02" | "03" | "04";

export interface EmisorXML {
  nombre: string;
  tipoIdentificacion: TipoIdHacienda;
  numeroIdentificacion: string;
  nombreComercial?: string;
  provincia?: string;
  canton?: string;
  distrito?: string;
  otrasSenas?: string;
  telefono?: string; // solo dígitos, 8-20
  correoElectronico: string;
  actividadEconomica: string; // CIIU4, e.g. "0121"
}

export interface ReceptorXML {
  nombre: string;
  tipoIdentificacion?: TipoIdHacienda;
  numeroIdentificacion?: string;
  correoElectronico?: string;
  actividadEconomicaReceptor?: string; // CIIU4 — obligatorio en FEC
}

export interface ExoneracionXML {
  tipoDocumento: string;      // e.g. "01"
  numeroDocumento: string;
  nombreInstitucion: string;
  fechaEmision: string;       // DD/MM/AAAA
  porcentajeExoneracion: number;
  montoExoneracion: string;
}

export interface LineaXML {
  numeroLinea: number;
  codigoCabys: string;
  codigoComercial?: string;
  cantidad: string;          // exactamente 3 decimales
  unidadMedida: string;      // e.g. "Unid", "kg", "L"
  descripcion: string;
  precioUnitario: string;    // 5 decimales
  montoTotal: string;        // cantidad × precioUnitario, 5 decimales
  descuentoMonto?: string;   // 5 decimales, si aplica
  descuentoNaturaleza?: string;
  subTotal: string;          // montoTotal − descuento, 5 decimales
  baseImponible: string;     // igual a subTotal (o 0 si exento)
  tipoImpuesto: TipoImpuesto;
  montoImpuesto: string;     // 5 decimales
  montoTotalLinea: string;   // subTotal + montoImpuesto
  exoneracion?: ExoneracionXML;
  esServicio?: boolean;      // false = mercancía (default)
}

export interface TotalesXML {
  totalServGravados: string;
  totalServExentos: string;
  totalServExonerado: string;
  totalMercanciasGravadas: string;
  totalMercanciasExentas: string;
  totalMercanciasExoneradas: string;
  totalGravado: string;
  totalExento: string;
  totalExonerado: string;
  totalVenta: string;        // suma bruta antes de descuentos
  totalDescuentos: string;
  totalVentaNeta: string;    // totalVenta − totalDescuentos
  totalImpuesto: string;
  totalComprobante: string;  // totalVentaNeta + totalImpuesto
}

export interface FacturaXMLInput {
  tipoComprobante: TipoComprobante;
  clave: string;             // 50 dígitos
  consecutivo: string;       // 20 dígitos
  fechaEmision: Date;
  emisor: EmisorXML;
  receptor?: ReceptorXML;
  condicionVenta: string;    // "01"=contado, "02"=crédito, etc.
  plazoCredito?: number;     // días, solo si condicionVenta="02"
  medioPago: string[];       // códigos Hacienda: "01","02","04","06","07","99"
  lineas: LineaXML[];
  moneda: "CRC" | "USD";
  tipoCambio: string;        // "1.00000" para CRC
  totales: TotalesXML;
  observaciones?: string;
  // Referencia para NC/ND/REP
  referencia?: {
    tipoDoc: string;         // "01"=FE, "03"=NC, etc.
    numero: string;          // clave 50 dígitos
    fechaEmision: string;    // ISO 8601
    codigo: string;          // "01"=anula, "02"=corrige, etc.
    razon: string;
  };
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

const NAMESPACE: Record<string, string> = {
  FE:  "https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/facturaElectronica",
  ND:  "https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/notaDebitoElectronica",
  NC:  "https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/notaCreditoElectronica",
  TE:  "https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/tiqueteElectronico",
  FEC: "https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/facturaElectronicaCompra",
  FEE: "https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/facturaElectronicaExportacion",
  REP: "https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/reciboElectronicoPago",
  NORMAL: "",
};

const ROOT_ELEMENT: Record<string, string> = {
  FE:  "FacturaElectronica",
  ND:  "NotaDebitoElectronica",
  NC:  "NotaCreditoElectronica",
  TE:  "TiqueteElectronico",
  FEC: "FacturaElectronicaCompra",
  FEE: "FacturaElectronicaExportacion",
  REP: "ReciboElectronicoPago",
};

/** Escapar caracteres especiales XML */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Fecha ISO 8601 en zona horaria de Costa Rica (UTC-6) */
function toISOCostaRica(date: Date): string {
  // Costa Rica no observa horario de verano, siempre UTC-6
  const offset = -6 * 60;
  const local = new Date(date.getTime() + offset * 60 * 1000);
  // Eliminar los milisegundos antes de agregar el offset (Hacienda no acepta .000)
  const iso = local.toISOString().replace(/\.\d{3}Z$/, "-06:00");
  return iso;
}

function tag(name: string, value: string | undefined, indent: string = ""): string {
  if (value === undefined || value === null || value === "") return "";
  return `${indent}<${name}>${esc(value)}</${name}>\n`;
}

function optTag(name: string, value: string | undefined, indent: string = ""): string {
  if (!value) return "";
  return tag(name, value, indent);
}

// ─── Generación de bloques ────────────────────────────────────────────────────

function buildIdentificacion(tipo: TipoIdHacienda, numero: string, indent: string): string {
  return (
    `${indent}<Identificacion>\n` +
    tag("Tipo", tipo, indent + "  ") +
    tag("Numero", numero, indent + "  ") +
    `${indent}</Identificacion>\n`
  );
}

function buildEmisor(e: EmisorXML): string {
  let xml = "  <Emisor>\n";
  xml += tag("Nombre", e.nombre, "    ");
  xml += buildIdentificacion(e.tipoIdentificacion, e.numeroIdentificacion, "    ");
  xml += optTag("NombreComercial", e.nombreComercial, "    ");
  if (e.provincia || e.canton || e.distrito || e.otrasSenas) {
    xml += "    <Ubicacion>\n";
    xml += optTag("Provincia", e.provincia, "      ");
    xml += optTag("Canton", e.canton, "      ");
    xml += optTag("Distrito", e.distrito, "      ");
    xml += optTag("OtrasSenas", e.otrasSenas, "      ");
    xml += "    </Ubicacion>\n";
  }
  if (e.telefono) {
    xml += "    <Telefono>\n";
    xml += tag("CodigoPais", "506", "      ");
    xml += tag("NumTelefono", e.telefono, "      ");
    xml += "    </Telefono>\n";
  }
  xml += tag("CorreoElectronico", e.correoElectronico, "    ");
  xml += "  </Emisor>\n";
  return xml;
}

function buildReceptor(r: ReceptorXML): string {
  let xml = "  <Receptor>\n";
  xml += tag("Nombre", r.nombre, "    ");
  if (r.tipoIdentificacion && r.numeroIdentificacion) {
    xml += buildIdentificacion(r.tipoIdentificacion, r.numeroIdentificacion, "    ");
  }
  xml += optTag("CorreoElectronico", r.correoElectronico, "    ");
  xml += optTag("ActividadEconomicaReceptor", r.actividadEconomicaReceptor, "    ");
  xml += "  </Receptor>\n";
  return xml;
}

function buildImpuesto(tipoImpuesto: TipoImpuesto, montoImpuesto: string): string {
  if (tipoImpuesto === "EXENTO") return "";

  const codigoTarifa = CODIGO_HACIENDA_IMPUESTO[tipoImpuesto]; // "02"–"06", "11"
  const tarifa = tipoImpuesto === "IVA_0_SIN_CREDITO" ? "0.000"
    : tipoImpuesto === "IVA_1" ? "1.000"
    : tipoImpuesto === "IVA_2" ? "2.000"
    : tipoImpuesto === "IVA_4" ? "4.000"
    : tipoImpuesto === "IVA_8" ? "8.000"
    : "13.000";

  return (
    "      <Impuesto>\n" +
    tag("Codigo", "07", "        ") +
    tag("CodigoTarifa", codigoTarifa, "        ") +
    tag("Tarifa", tarifa, "        ") +
    tag("Monto", montoImpuesto, "        ") +
    "      </Impuesto>\n"
  );
}

function buildLinea(l: LineaXML): string {
  let xml = "    <LineaDetalle>\n";
  xml += tag("NumeroLinea", String(l.numeroLinea), "      ");
  // CABYS obligatorio v4.4
  xml += tag("Codigo", l.codigoCabys, "      ");
  if (l.codigoComercial) {
    xml += "      <CodigoComercial>\n";
    xml += tag("Tipo", "04", "        "); // 04 = código interno
    xml += tag("Codigo", l.codigoComercial, "        ");
    xml += "      </CodigoComercial>\n";
  }
  xml += tag("Cantidad", l.cantidad, "      ");
  xml += tag("UnidadMedida", l.unidadMedida, "      ");
  xml += tag("Descripcion", l.descripcion, "      ");
  xml += tag("PrecioUnitario", l.precioUnitario, "      ");
  xml += tag("MontoTotal", l.montoTotal, "      ");

  if (l.descuentoMonto && new Decimal(l.descuentoMonto).gt(0)) {
    xml += "      <Descuento>\n";
    xml += tag("MontoDescuento", l.descuentoMonto, "        ");
    xml += tag("NaturalezaDescuento", l.descuentoNaturaleza ?? "Descuento comercial", "        ");
    xml += "      </Descuento>\n";
  }

  xml += tag("SubTotal", l.subTotal, "      ");
  // BaseImponible: 0 si exento, igual a subTotal para gravados
  const baseImponible = l.tipoImpuesto === "EXENTO" ? "0.00000" : l.baseImponible;
  xml += tag("BaseImponible", baseImponible, "      ");

  xml += buildImpuesto(l.tipoImpuesto, l.montoImpuesto);

  // ImpuestoNeto = montoImpuesto (sin exoneraciones en v básico)
  if (l.tipoImpuesto !== "EXENTO") {
    xml += tag("ImpuestoNeto", l.montoImpuesto, "      ");
  }

  xml += tag("MontoTotalLinea", l.montoTotalLinea, "      ");
  xml += "    </LineaDetalle>\n";
  return xml;
}

function buildResumen(input: FacturaXMLInput): string {
  const t = input.totales;
  let xml = "  <ResumenFactura>\n";
  xml += "    <CodigoTipoMoneda>\n";
  xml += tag("CodigoMoneda", input.moneda, "      ");
  xml += tag("TipoCambio", input.tipoCambio, "      ");
  xml += "    </CodigoTipoMoneda>\n";
  xml += tag("TotalServGravados", t.totalServGravados, "    ");
  xml += tag("TotalServExentos", t.totalServExentos, "    ");
  xml += tag("TotalServExonerado", t.totalServExonerado, "    ");
  xml += tag("TotalMercanciasGravadas", t.totalMercanciasGravadas, "    ");
  xml += tag("TotalMercanciasExentas", t.totalMercanciasExentas, "    ");
  xml += tag("TotalMercanciasExoneradas", t.totalMercanciasExoneradas, "    ");
  xml += tag("TotalGravado", t.totalGravado, "    ");
  xml += tag("TotalExento", t.totalExento, "    ");
  xml += tag("TotalExonerado", t.totalExonerado, "    ");
  xml += tag("TotalVenta", t.totalVenta, "    ");
  xml += tag("TotalDescuentos", t.totalDescuentos, "    ");
  xml += tag("TotalVentaNeta", t.totalVentaNeta, "    ");
  xml += tag("TotalImpuesto", t.totalImpuesto, "    ");
  xml += tag("TotalComprobante", t.totalComprobante, "    ");
  for (const medio of input.medioPago) {
    xml += tag("MedioPago", medio, "    ");
  }
  xml += "  </ResumenFactura>\n";
  return xml;
}

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Construye el XML v4.4 de Hacienda Costa Rica.
 * Retorna el XML como string (sin firma).
 * Lanzará si el tipo de comprobante no tiene soporte XML (NORMAL).
 */
export function construirXML(input: FacturaXMLInput): string {
  const tipo = input.tipoComprobante;
  if (!ROOT_ELEMENT[tipo]) {
    throw new Error(`El tipo de comprobante ${tipo} no genera XML electrónico`);
  }
  const rootEl = ROOT_ELEMENT[tipo];
  const ns = NAMESPACE[tipo];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<${rootEl} xmlns="${ns}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n`;

  // Clave + consecutivo
  xml += tag("Clave", input.clave, "  ");
  xml += tag("CodigoActividad", input.emisor.actividadEconomica, "  ");
  xml += tag("NumeroConsecutivo", input.consecutivo, "  ");
  xml += tag("FechaEmision", toISOCostaRica(input.fechaEmision), "  ");

  // Emisor
  xml += buildEmisor(input.emisor);

  // Receptor (TE no lleva receptor identificado en muchos casos)
  if (input.receptor) {
    xml += buildReceptor(input.receptor);
  }

  // Condición de venta y plazo
  xml += tag("CondicionVenta", input.condicionVenta, "  ");
  if (input.condicionVenta === "02" && input.plazoCredito !== undefined) {
    xml += tag("PlazoCredito", String(input.plazoCredito), "  ");
  }

  // Medio de pago (en encabezado — requerido por XSD aunque también va en resumen)
  // TODO: Confirmar si en v4.4 va solo en ResumenFactura o también aquí.
  for (const medio of input.medioPago) {
    xml += tag("MedioPago", medio, "  ");
  }

  // Referencia (para NC, ND, REP)
  if (input.referencia) {
    const r = input.referencia;
    xml += "  <InformacionReferencia>\n";
    xml += tag("TipoDoc", r.tipoDoc, "    ");
    xml += tag("Numero", r.numero, "    ");
    xml += tag("FechaEmisionDoc", r.fechaEmision, "    ");
    xml += tag("Codigo", r.codigo, "    ");
    xml += tag("Razon", r.razon, "    ");
    xml += "  </InformacionReferencia>\n";
  }

  // Detalle de líneas
  xml += "  <DetalleServicio>\n";
  for (const linea of input.lineas) {
    xml += buildLinea(linea);
  }
  xml += "  </DetalleServicio>\n";

  // Resumen
  xml += buildResumen(input);

  // Normativa
  // TODO: Verificar NumeroResolucion y FechaResolucion vigentes para v4.4 en TRIBU-CR.
  xml += "  <Normativa>\n";
  xml += tag("NumeroResolucion", "MH-DGT-RES-0021-2022", "    ");
  xml += tag("FechaResolucion", "15-12-2022 08:00:00", "    ");
  xml += "  </Normativa>\n";

  if (input.observaciones) {
    xml += "  <Otros>\n";
    xml += tag("OtroTexto", input.observaciones, "    ");
    xml += "  </Otros>\n";
  }

  xml += `</${rootEl}>\n`;
  return xml;
}

// ─── Helper: calcular totales para el XML desde lineas calculadas ─────────────

import type { LineaCalculada, TotalesFactura } from "@/domain/facturacion/calcular-totales";

/**
 * Construye TotalesXML desde TotalesFactura (resultado de calcularTotales).
 * Tratamos todas las líneas como mercancías (no servicios).
 * La distinción servicio/mercancía no está en el modelo actual.
 */
export function calcularTotalesXML(
  totales: TotalesFactura,
  lineas: LineaCalculada[]
): TotalesXML {
  let gravadas = new Decimal(0);
  let exentas = new Decimal(0);

  for (const l of lineas) {
    if (l.tipoImpuesto === "EXENTO") {
      exentas = exentas.plus(l.baseImponible);
    } else {
      gravadas = gravadas.plus(l.baseImponible);
    }
  }

  const d5 = (d: Decimal) => d.toFixed(5);

  return {
    totalServGravados:           "0.00000",
    totalServExentos:            "0.00000",
    totalServExonerado:          "0.00000",
    totalMercanciasGravadas:     d5(gravadas),
    totalMercanciasExentas:      d5(exentas),
    totalMercanciasExoneradas:   "0.00000",
    totalGravado:                d5(gravadas),
    totalExento:                 d5(exentas),
    totalExonerado:              "0.00000",
    totalVenta:                  d5(totales.subtotal),
    totalDescuentos:             d5(totales.descuento),
    totalVentaNeta:              d5(totales.baseImponible),
    totalImpuesto:               d5(totales.totalImpuesto),
    totalComprobante:            d5(totales.total),
  };
}

// ─── Helper: mapear TipoPago → código MedioPago Hacienda ─────────────────────

export function tipoPagoAMedioPago(tipoPago: string): string {
  switch (tipoPago) {
    case "CONTADO":           return "01"; // efectivo
    case "TARJETA":           return "02";
    case "TRANSFERENCIA":     return "04";
    case "SINPE_MOVIL":       return "06";
    case "PLATAFORMA_DIGITAL":return "07";
    case "CREDITO":           return "99"; // crédito
    default:                  return "99";
  }
}

// ─── Helper: mapear TipoPago → condición de venta ────────────────────────────

export function tipoPagoACondicionVenta(tipoPago: string): string {
  return tipoPago === "CREDITO" ? "02" : "01";
}

// ─── Helper: mapear tipo de identificación interna → código Hacienda ─────────

export function tipoIdAHacienda(tipo: string): TipoIdHacienda | undefined {
  switch (tipo) {
    case "FISICA":   return "01";
    case "JURIDICA": return "02";
    case "DIMEX":    return "03";
    case "NITE":     return "04";
    default:         return undefined; // GENERICO, EXTRANJERO_ND — sin código
  }
}
