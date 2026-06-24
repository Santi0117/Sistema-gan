import type { TipoComprobante, SituacionComprobante } from "./tipos";

// Clave numérica 50 dígitos — Hacienda CR v4.4
// Formato: país(3) + fecha(6) + cédula_emisor(12) + situación(1) + consecutivo(20) + seguridad(8)

export interface ClaveNumerica {
  fecha: Date;
  identificacionEmisor: string; // cédula/RUC, se normaliza a 12 dígitos
  situacion?: SituacionComprobante;
  consecutivo: string; // 20 dígitos generado por generarConsecutivo()
}

/**
 * Genera la clave numérica de 50 dígitos según spec Hacienda v4.4.
 * Función pura, no tiene side-effects (excepto crypto.getRandomValues para seguridad).
 */
export function generarClaveNumerica(params: ClaveNumerica): string {
  const { fecha, identificacionEmisor, situacion = "1", consecutivo } = params;

  if (consecutivo.length !== 20) {
    throw new Error(`Consecutivo debe tener 20 dígitos, tiene ${consecutivo.length}`);
  }
  if (!/^\d{20}$/.test(consecutivo)) {
    throw new Error("Consecutivo debe contener solo dígitos");
  }

  const fechaStr = formatFecha(fecha);               // 6 dígitos: ddMMyy
  const idStr = normalizarId(identificacionEmisor);  // 12 dígitos
  const seguridad = generarCodigoSeguridad();        // 8 dígitos

  const clave = `506${fechaStr}${idStr}${situacion}${consecutivo}${seguridad}`;

  if (clave.length !== 50) {
    throw new Error(`Error interno: clave tiene ${clave.length} dígitos, esperaba 50`);
  }

  return clave;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Formatea fecha como ddMMyy (6 dígitos, año 2 cifras) */
function formatFecha(fecha: Date): string {
  const d = String(fecha.getDate()).padStart(2, "0");
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const y = String(fecha.getFullYear()).slice(-2);
  return `${d}${m}${y}`;
}

/** Normaliza la identificación del emisor a exactamente 12 dígitos numéricos */
function normalizarId(id: string): string {
  const soloDigitos = id.replace(/\D/g, "");
  if (soloDigitos.length === 0) throw new Error("Identificación del emisor inválida");
  return soloDigitos.padStart(12, "0").slice(0, 12);
}

/** Genera código de seguridad de 8 dígitos usando crypto */
export function generarCodigoSeguridad(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 100_000_000).padStart(8, "0");
}

// ─── Validación ──────────────────────────────────────────────────────────────

/** Valida que una clave numérica tenga formato correcto */
export function validarClaveNumerica(clave: string): {
  valida: boolean;
  errores: string[];
} {
  const errores: string[] = [];

  if (clave.length !== 50) errores.push(`Longitud inválida: ${clave.length}, esperaba 50`);
  if (!/^\d+$/.test(clave)) errores.push("Debe contener solo dígitos");
  if (clave.slice(0, 3) !== "506") errores.push("Los primeros 3 dígitos deben ser 506 (Costa Rica)");
  if (!["1", "2", "3"].includes(clave[21] ?? "")) {
    errores.push("Situación (posición 22) debe ser 1, 2 o 3");
  }

  return { valida: errores.length === 0, errores };
}

/** Parsea los componentes de una clave numérica de 50 dígitos */
export function parsearClaveNumerica(clave: string) {
  if (clave.length !== 50) throw new Error("Clave no tiene 50 dígitos");
  return {
    pais: clave.slice(0, 3),
    fecha: clave.slice(3, 9),
    identificacion: clave.slice(9, 21),
    situacion: clave.slice(21, 22) as SituacionComprobante,
    consecutivo: clave.slice(22, 42),
    codigoSeguridad: clave.slice(42, 50),
  };
}

// Alias semántico para uso externo
export type { TipoComprobante };
