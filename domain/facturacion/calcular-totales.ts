import Decimal from "decimal.js";
import { roundFiscal } from "@/lib/money";
import { TARIFAS_IVA, type TipoImpuesto } from "./tipos";

// ─── Interfaces de entrada/salida ────────────────────────────────────────────

export interface LineaInput {
  cantidad: string;
  precioUnitario: string;
  descuentoPct?: string; // porcentaje, e.g. "10" = 10%
  tipoImpuesto: TipoImpuesto;
}

export interface LineaCalculada {
  cantidad: Decimal;
  precioUnitario: Decimal;
  descuentoPct: Decimal;
  descuentoMonto: Decimal;
  subtotalLinea: Decimal; // cantidad × precioUnitario
  baseImponible: Decimal; // subtotalLinea − descuentoMonto
  tipoImpuesto: TipoImpuesto;
  tarifaImpuesto: Decimal; // como número, e.g. 13
  montoImpuesto: Decimal;
  totalLinea: Decimal;
}

export interface TotalesFactura {
  subtotal: Decimal;      // suma de subtotalLinea (antes de descuentos)
  descuento: Decimal;     // suma de descuentoMonto de todas las líneas
  baseImponible: Decimal; // subtotal − descuento
  impuestoPorTarifa: Record<string, Decimal>; // key = "13", "8", etc.
  totalImpuesto: Decimal;
  total: Decimal;         // baseImponible + totalImpuesto
  lineas: LineaCalculada[];
}

// ─── Cálculo por línea ───────────────────────────────────────────────────────

/**
 * Calcula todos los campos de una línea de factura.
 * Precisión interna: 5 decimales (norma Hacienda CR).
 * Sin imports de Next, React ni Drizzle — función pura.
 */
export function calcularLinea(input: LineaInput): LineaCalculada {
  const cantidad = new Decimal(input.cantidad);
  const precioUnitario = new Decimal(input.precioUnitario);
  const descuentoPct = new Decimal(input.descuentoPct ?? "0");
  const tarifaImpuesto = new Decimal(TARIFAS_IVA[input.tipoImpuesto]);

  if (cantidad.lte(0)) throw new Error("Cantidad debe ser mayor a 0");
  if (precioUnitario.lt(0)) throw new Error("Precio unitario no puede ser negativo");
  if (descuentoPct.lt(0) || descuentoPct.gt(100))
    throw new Error("Descuento debe estar entre 0 y 100");

  const subtotalLinea = roundFiscal(cantidad.mul(precioUnitario));
  const descuentoMonto = roundFiscal(subtotalLinea.mul(descuentoPct).div(100));
  const baseImponible = roundFiscal(subtotalLinea.minus(descuentoMonto));
  const montoImpuesto = roundFiscal(baseImponible.mul(tarifaImpuesto).div(100));
  const totalLinea = roundFiscal(baseImponible.plus(montoImpuesto));

  return {
    cantidad,
    precioUnitario,
    descuentoPct,
    descuentoMonto,
    subtotalLinea,
    baseImponible,
    tipoImpuesto: input.tipoImpuesto,
    tarifaImpuesto,
    montoImpuesto,
    totalLinea,
  };
}

// ─── Cálculo de totales de la factura ────────────────────────────────────────

/**
 * Calcula los totales de una factura a partir de sus líneas.
 * Los impuestos se desglosan por tarifa para el XML de Hacienda.
 */
export function calcularTotales(lineasInput: LineaInput[]): TotalesFactura {
  if (lineasInput.length === 0) throw new Error("La factura debe tener al menos una línea");

  const lineas = lineasInput.map(calcularLinea);

  let subtotal = new Decimal(0);
  let descuento = new Decimal(0);
  let totalImpuesto = new Decimal(0);
  const impuestoPorTarifa: Record<string, Decimal> = {};

  for (const linea of lineas) {
    subtotal = subtotal.plus(linea.subtotalLinea);
    descuento = descuento.plus(linea.descuentoMonto);
    totalImpuesto = totalImpuesto.plus(linea.montoImpuesto);

    const key = linea.tarifaImpuesto.toString();
    impuestoPorTarifa[key] = (impuestoPorTarifa[key] ?? new Decimal(0)).plus(linea.montoImpuesto);
  }

  const baseImponible = roundFiscal(subtotal.minus(descuento));
  const total = roundFiscal(baseImponible.plus(totalImpuesto));

  return {
    subtotal: roundFiscal(subtotal),
    descuento: roundFiscal(descuento),
    baseImponible,
    impuestoPorTarifa,
    totalImpuesto: roundFiscal(totalImpuesto),
    total,
    lineas,
  };
}
