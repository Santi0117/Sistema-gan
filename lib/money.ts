import Decimal from "decimal.js";

// Configure Decimal for Hacienda-compliant calculations
// 5 decimal precision internally, round half-even per fiscal rules
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN });

export type MoneyInput = string | number | Decimal;

export function toDecimal(value: MoneyInput): Decimal {
  return new Decimal(value);
}

/** Round to 5 decimal places (Hacienda internal precision) */
export function roundFiscal(value: MoneyInput): Decimal {
  return new Decimal(value).toDecimalPlaces(5, Decimal.ROUND_HALF_EVEN);
}

/** Round to 2 decimal places for display/storage */
export function roundDisplay(value: MoneyInput): Decimal {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN);
}

/** Format as Costa Rican colones string */
export function formatCRC(value: MoneyInput): string {
  const num = new Decimal(value).toDecimalPlaces(2).toNumber();
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 2,
  }).format(num);
}

/** Format as USD string */
export function formatUSD(value: MoneyInput): string {
  const num = new Decimal(value).toDecimalPlaces(2).toNumber();
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}

/** Multiply two decimal values with fiscal precision */
export function multiply(a: MoneyInput, b: MoneyInput): Decimal {
  return roundFiscal(new Decimal(a).mul(new Decimal(b)));
}

/** Add an array of decimal values */
export function sum(values: MoneyInput[]): Decimal {
  return values.reduce(
    (acc: Decimal, v: MoneyInput) => acc.plus(new Decimal(v)),
    new Decimal(0)
  );
}

export { Decimal };
