/**
 * Validación estructural del XML antes de firmarlo.
 *
 * TODO: Implementar validación contra XSD oficial v4.4.
 * Los XSD están disponibles en https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/
 * Para validación XSD completa en Node.js se requiere libxml2 (libxmljs2) o similar.
 *
 * Por ahora implementamos validación estructural: campos obligatorios, longitudes, etc.
 */

export interface ValidacionResult {
  valido: boolean;
  errores: string[];
}

// Campos obligatorios según XSD v4.4
const CAMPOS_OBLIGATORIOS = [
  "Clave",
  "CodigoActividad",
  "NumeroConsecutivo",
  "FechaEmision",
  "Emisor",
  "CondicionVenta",
  "MedioPago",
  "DetalleServicio",
  "ResumenFactura",
  "Normativa",
];

function getText(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "s");
  return re.exec(xml)?.[1]?.trim();
}

function hasTag(xml: string, tag: string): boolean {
  return new RegExp(`<${tag}[\\s>]`).test(xml);
}

function countTags(xml: string, tag: string): number {
  return (xml.match(new RegExp(`<${tag}[\\s>]`, "g")) ?? []).length;
}

/**
 * Valida el XML estructuralmente antes de enviar a Hacienda.
 * No reemplaza la validación XSD completa — es una red de seguridad rápida.
 */
export function validarXML(xmlString: string): ValidacionResult {
  const errores: string[] = [];

  // Verificar campos obligatorios presentes
  for (const campo of CAMPOS_OBLIGATORIOS) {
    if (!hasTag(xmlString, campo)) {
      errores.push(`Campo obligatorio ausente: <${campo}>`);
    }
  }

  // Validar Clave: 50 dígitos exactos
  const clave = getText(xmlString, "Clave");
  if (clave !== undefined) {
    if (!/^\d{50}$/.test(clave)) {
      errores.push(`Clave inválida: debe tener exactamente 50 dígitos numéricos (tiene ${clave.length})`);
    }
  }

  // Validar NumeroConsecutivo: 20 dígitos
  const consecutivo = getText(xmlString, "NumeroConsecutivo");
  if (consecutivo !== undefined) {
    if (!/^\d{20}$/.test(consecutivo)) {
      errores.push(`NumeroConsecutivo inválido: debe tener 20 dígitos (tiene ${consecutivo?.length})`);
    }
  }

  // Validar FechaEmision: formato ISO 8601 con timezone
  const fecha = getText(xmlString, "FechaEmision");
  if (fecha !== undefined && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(fecha)) {
    errores.push(`FechaEmision inválida: debe ser ISO 8601 con timezone (ej: 2026-06-23T10:30:00-06:00)`);
  }

  // Debe tener al menos una LineaDetalle
  const numLineas = countTags(xmlString, "LineaDetalle");
  if (numLineas === 0) {
    errores.push("El comprobante debe tener al menos una LineaDetalle");
  }

  // Verificar que cada LineaDetalle tenga Codigo (CABYS)
  const lineasConCabys = (xmlString.match(/<LineaDetalle>[\s\S]*?<\/LineaDetalle>/g) ?? []).filter(
    (l) => hasTag(l, "Codigo")
  );
  if (lineasConCabys.length < numLineas) {
    errores.push("Todas las líneas deben tener código CABYS (<Codigo>)");
  }

  // Verificar TotalComprobante presente en ResumenFactura
  if (!hasTag(xmlString, "TotalComprobante")) {
    errores.push("ResumenFactura debe incluir TotalComprobante");
  }

  // Validar CondicionVenta: 01–09
  const condicion = getText(xmlString, "CondicionVenta");
  if (condicion !== undefined && !/^0[1-9]$/.test(condicion)) {
    errores.push(`CondicionVenta inválida: ${condicion}`);
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}
