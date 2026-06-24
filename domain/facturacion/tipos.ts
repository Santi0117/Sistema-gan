// ─── Tipos de impuesto ───────────────────────────────────────────────────────

export type TipoImpuesto =
  | "EXENTO"
  | "IVA_0_SIN_CREDITO" // Código 11 v4.4: tarifa 0% sin derecho a crédito
  | "IVA_1"
  | "IVA_2"
  | "IVA_4"
  | "IVA_8"
  | "IVA_13";

export type TipoComprobante =
  | "FE"     // 01 Factura Electrónica
  | "ND"     // 02 Nota de Débito
  | "NC"     // 03 Nota de Crédito
  | "TE"     // 04 Tiquete Electrónico
  | "FEC"    // 08 Factura Electrónica de Compra
  | "FEE"    // 09 Factura Electrónica de Exportación
  | "REP"    // 10 Recibo Electrónico de Pago (nuevo en v4.4)
  | "NORMAL"; // Factura local sin envío a MH

export type SituacionComprobante =
  | "1" // Normal
  | "2" // Contingencia
  | "3"; // Sin internet

// ─── Tarifas IVA (porcentaje numérico) ──────────────────────────────────────

export const TARIFAS_IVA: Record<TipoImpuesto, number> = {
  EXENTO: 0,
  IVA_0_SIN_CREDITO: 0,
  IVA_1: 1,
  IVA_2: 2,
  IVA_4: 4,
  IVA_8: 8,
  IVA_13: 13,
};

// ─── Códigos Hacienda v4.4 ───────────────────────────────────────────────────

/** Código de tarifa IVA en el XML v4.4 */
export const CODIGO_HACIENDA_IMPUESTO: Record<TipoImpuesto, string> = {
  EXENTO: "01",
  IVA_0_SIN_CREDITO: "11", // Obligatorio v4.4
  IVA_1: "02",
  IVA_2: "03",
  IVA_4: "04",
  IVA_8: "05",
  IVA_13: "06",
};

/** Código de tipo comprobante en la clave numérica */
export const CODIGO_TIPO_COMPROBANTE: Record<TipoComprobante, string> = {
  FE: "01",
  ND: "02",
  NC: "03",
  TE: "04",
  FEC: "08",
  FEE: "09",
  REP: "10",
  NORMAL: "00", // No aplica en Hacienda
};

export const TIPOS_COMPROBANTE_ELECTRONICOS: TipoComprobante[] = [
  "FE",
  "ND",
  "NC",
  "TE",
  "FEC",
  "FEE",
  "REP",
];
