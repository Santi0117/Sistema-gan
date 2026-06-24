import { CODIGO_TIPO_COMPROBANTE, type TipoComprobante } from "./tipos";

// Consecutivo 20 dígitos — Hacienda CR v4.4
// Formato: sucursal(3) + terminal(5) + tipo_comprobante(2) + secuencia(10)

export interface ConsecutivoParams {
  sucursal?: number; // default 1
  terminal?: number; // default 1
  tipo: TipoComprobante;
  secuencia: number; // 1 – 9_999_999_999
}

/**
 * Genera el consecutivo de 20 dígitos según spec Hacienda v4.4.
 * Función pura — la secuencia se incrementa externamente.
 */
export function generarConsecutivo(params: ConsecutivoParams): string {
  const { sucursal = 1, terminal = 1, tipo, secuencia } = params;

  if (tipo === "NORMAL") {
    throw new Error("Comprobante NORMAL no tiene consecutivo de Hacienda");
  }

  const tipoCodigo = CODIGO_TIPO_COMPROBANTE[tipo];
  if (!tipoCodigo || tipoCodigo === "00") {
    throw new Error(`Tipo comprobante sin código Hacienda: ${tipo}`);
  }

  if (!Number.isInteger(sucursal) || sucursal < 1 || sucursal > 999) {
    throw new Error(`Sucursal inválida: ${sucursal} (1–999)`);
  }
  if (!Number.isInteger(terminal) || terminal < 1 || terminal > 99999) {
    throw new Error(`Terminal inválida: ${terminal} (1–99999)`);
  }
  if (!Number.isInteger(secuencia) || secuencia < 1 || secuencia > 9_999_999_999) {
    throw new Error(`Secuencia inválida: ${secuencia} (1–9999999999)`);
  }

  const sucursalStr = String(sucursal).padStart(3, "0");
  const terminalStr = String(terminal).padStart(5, "0");
  const secuenciaStr = String(secuencia).padStart(10, "0");

  const consecutivo = `${sucursalStr}${terminalStr}${tipoCodigo}${secuenciaStr}`;

  if (consecutivo.length !== 20) {
    throw new Error(`Error interno: consecutivo tiene ${consecutivo.length} dígitos`);
  }

  return consecutivo;
}

/** Valida que un consecutivo tenga el formato correcto */
export function validarConsecutivo(consecutivo: string): {
  valido: boolean;
  errores: string[];
} {
  const errores: string[] = [];

  if (consecutivo.length !== 20) {
    errores.push(`Longitud inválida: ${consecutivo.length}, esperaba 20`);
  }
  if (!/^\d{20}$/.test(consecutivo)) {
    errores.push("Debe contener solo dígitos");
  }

  return { valido: errores.length === 0, errores };
}

/** Parsea los componentes de un consecutivo de 20 dígitos */
export function parsearConsecutivo(consecutivo: string) {
  if (consecutivo.length !== 20) throw new Error("Consecutivo no tiene 20 dígitos");
  return {
    sucursal: consecutivo.slice(0, 3),
    terminal: consecutivo.slice(3, 8),
    tipoCodigo: consecutivo.slice(8, 10),
    secuencia: parseInt(consecutivo.slice(10, 20), 10),
  };
}
