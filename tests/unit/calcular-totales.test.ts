import { describe, it, expect } from "vitest";
import { calcularLinea, calcularTotales } from "@/domain/facturacion/calcular-totales";

// ─── Tests por línea individual ──────────────────────────────────────────────

describe("calcularLinea — tarifas IVA", () => {
  it("IVA 13% — caso base", () => {
    const l = calcularLinea({ cantidad: "1", precioUnitario: "1000", tipoImpuesto: "IVA_13" });
    expect(l.subtotalLinea.toFixed(5)).toBe("1000.00000");
    expect(l.baseImponible.toFixed(5)).toBe("1000.00000");
    expect(l.tarifaImpuesto.toNumber()).toBe(13);
    expect(l.montoImpuesto.toFixed(5)).toBe("130.00000");
    expect(l.totalLinea.toFixed(5)).toBe("1130.00000");
  });

  it("IVA 8% — seguros/hoteles", () => {
    const l = calcularLinea({ cantidad: "1", precioUnitario: "1000", tipoImpuesto: "IVA_8" });
    expect(l.montoImpuesto.toFixed(5)).toBe("80.00000");
    expect(l.totalLinea.toFixed(5)).toBe("1080.00000");
  });

  it("IVA 4% — servicios de salud", () => {
    const l = calcularLinea({ cantidad: "2", precioUnitario: "1000", tipoImpuesto: "IVA_4" });
    expect(l.subtotalLinea.toFixed(5)).toBe("2000.00000");
    expect(l.montoImpuesto.toFixed(5)).toBe("80.00000");
    expect(l.totalLinea.toFixed(5)).toBe("2080.00000");
  });

  it("IVA 2%", () => {
    const l = calcularLinea({ cantidad: "1", precioUnitario: "500", tipoImpuesto: "IVA_2" });
    expect(l.montoImpuesto.toFixed(5)).toBe("10.00000");
  });

  it("IVA 1% — medicamentos", () => {
    const l = calcularLinea({ cantidad: "10", precioUnitario: "500", tipoImpuesto: "IVA_1" });
    expect(l.subtotalLinea.toFixed(5)).toBe("5000.00000");
    expect(l.montoImpuesto.toFixed(5)).toBe("50.00000");
  });

  it("EXENTO — sin IVA", () => {
    const l = calcularLinea({ cantidad: "1", precioUnitario: "500", tipoImpuesto: "EXENTO" });
    expect(l.tarifaImpuesto.toNumber()).toBe(0);
    expect(l.montoImpuesto.toFixed(5)).toBe("0.00000");
    expect(l.totalLinea.toFixed(5)).toBe("500.00000");
  });

  it("IVA_0_SIN_CREDITO — código 11 v4.4, tarifa 0% sin crédito", () => {
    const l = calcularLinea({ cantidad: "1", precioUnitario: "100", tipoImpuesto: "IVA_0_SIN_CREDITO" });
    expect(l.tarifaImpuesto.toNumber()).toBe(0);
    expect(l.montoImpuesto.toFixed(5)).toBe("0.00000");
    expect(l.totalLinea.toFixed(5)).toBe("100.00000");
  });
});

// ─── Tests de descuento por línea ────────────────────────────────────────────

describe("calcularLinea — descuentos", () => {
  it("descuento 10% con IVA 13%", () => {
    const l = calcularLinea({
      cantidad: "1",
      precioUnitario: "1000",
      descuentoPct: "10",
      tipoImpuesto: "IVA_13",
    });
    expect(l.descuentoMonto.toFixed(5)).toBe("100.00000");
    expect(l.baseImponible.toFixed(5)).toBe("900.00000");
    expect(l.montoImpuesto.toFixed(5)).toBe("117.00000"); // 900 × 0.13
    expect(l.totalLinea.toFixed(5)).toBe("1017.00000");
  });

  it("descuento 100% — precio final cero", () => {
    const l = calcularLinea({
      cantidad: "1",
      precioUnitario: "500",
      descuentoPct: "100",
      tipoImpuesto: "IVA_13",
    });
    expect(l.baseImponible.toFixed(5)).toBe("0.00000");
    expect(l.montoImpuesto.toFixed(5)).toBe("0.00000");
    expect(l.totalLinea.toFixed(5)).toBe("0.00000");
  });

  it("descuento 0% no modifica el precio", () => {
    const l = calcularLinea({
      cantidad: "1",
      precioUnitario: "1000",
      descuentoPct: "0",
      tipoImpuesto: "IVA_13",
    });
    expect(l.descuentoMonto.toFixed(5)).toBe("0.00000");
    expect(l.baseImponible.toFixed(5)).toBe("1000.00000");
  });

  it("descuento fraccionario con IVA", () => {
    const l = calcularLinea({
      cantidad: "1",
      precioUnitario: "1000",
      descuentoPct: "5.5",
      tipoImpuesto: "IVA_13",
    });
    // 1000 × 5.5% = 55 descuento → base = 945 → IVA = 945 × 0.13 = 122.85
    expect(l.descuentoMonto.toFixed(5)).toBe("55.00000");
    expect(l.baseImponible.toFixed(5)).toBe("945.00000");
    expect(l.montoImpuesto.toFixed(5)).toBe("122.85000");
  });
});

// ─── Tests de redondeo Hacienda (5 decimales) ────────────────────────────────

describe("calcularLinea — redondeo fiscal", () => {
  it("precio fraccional × cantidad entera", () => {
    const l = calcularLinea({
      cantidad: "3",
      precioUnitario: "333.33333",
      tipoImpuesto: "IVA_13",
    });
    // 3 × 333.33333 = 999.99999 (exacto en 5 decimales)
    expect(l.subtotalLinea.toFixed(5)).toBe("999.99999");
    // 999.99999 × 0.13 = 129.9999987 → 6.° decimal es 8 → redondea a 130.00000
    expect(l.montoImpuesto.toFixed(5)).toBe("130.00000");
    expect(l.totalLinea.toFixed(5)).toBe("1129.99999");
  });

  it("redondeo half-even — dígito par con mitad exacta redondea hacia abajo", () => {
    // 1.000025: 5.° decimal = 2 (par) y siguiente es 5 exacto → ROUND_HALF_EVEN: queda en 1.00002
    const l = calcularLinea({ cantidad: "1", precioUnitario: "1.000025", tipoImpuesto: "EXENTO" });
    expect(l.subtotalLinea.toFixed(5)).toBe("1.00002");
  });

  it("redondeo half-even — dígito impar con mitad exacta redondea hacia arriba", () => {
    // 1.000035: 5.° decimal = 3 (impar) → ROUND_HALF_EVEN: sube a 1.00004
    const l = calcularLinea({ cantidad: "1", precioUnitario: "1.000035", tipoImpuesto: "EXENTO" });
    expect(l.subtotalLinea.toFixed(5)).toBe("1.00004");
  });

  it("cantidad decimal (ventas por peso)", () => {
    const l = calcularLinea({
      cantidad: "1.5",
      precioUnitario: "2000",
      tipoImpuesto: "IVA_13",
    });
    expect(l.subtotalLinea.toFixed(5)).toBe("3000.00000");
    expect(l.montoImpuesto.toFixed(5)).toBe("390.00000");
    expect(l.totalLinea.toFixed(5)).toBe("3390.00000");
  });

  it("IVA con resultado fraccionario", () => {
    // 100 × 13% = 13 exacto
    // 101 × 13% = 13.13 exacto
    // 101.11 × 13% = 13.1443 exacto
    const l = calcularLinea({
      cantidad: "1",
      precioUnitario: "101.11",
      tipoImpuesto: "IVA_13",
    });
    expect(l.montoImpuesto.toFixed(5)).toBe("13.14430");
  });
});

// ─── Tests de validación ─────────────────────────────────────────────────────

describe("calcularLinea — validaciones", () => {
  it("rechaza cantidad cero", () => {
    expect(() =>
      calcularLinea({ cantidad: "0", precioUnitario: "100", tipoImpuesto: "IVA_13" })
    ).toThrow("Cantidad debe ser mayor a 0");
  });

  it("rechaza cantidad negativa", () => {
    expect(() =>
      calcularLinea({ cantidad: "-1", precioUnitario: "100", tipoImpuesto: "IVA_13" })
    ).toThrow();
  });

  it("rechaza precio negativo", () => {
    expect(() =>
      calcularLinea({ cantidad: "1", precioUnitario: "-100", tipoImpuesto: "IVA_13" })
    ).toThrow("Precio unitario no puede ser negativo");
  });

  it("rechaza descuento mayor a 100%", () => {
    expect(() =>
      calcularLinea({ cantidad: "1", precioUnitario: "100", descuentoPct: "101", tipoImpuesto: "IVA_13" })
    ).toThrow("Descuento debe estar entre 0 y 100");
  });
});

// ─── Tests de totales de factura ─────────────────────────────────────────────

describe("calcularTotales", () => {
  it("factura con una sola línea IVA 13%", () => {
    const t = calcularTotales([{ cantidad: "1", precioUnitario: "1000", tipoImpuesto: "IVA_13" }]);
    expect(t.subtotal.toFixed(5)).toBe("1000.00000");
    expect(t.descuento.toFixed(5)).toBe("0.00000");
    expect(t.totalImpuesto.toFixed(5)).toBe("130.00000");
    expect(t.total.toFixed(5)).toBe("1130.00000");
  });

  it("factura con tarifas mixtas — desglose por tarifa", () => {
    const t = calcularTotales([
      { cantidad: "1", precioUnitario: "1000", tipoImpuesto: "IVA_13" },
      { cantidad: "1", precioUnitario: "500", tipoImpuesto: "EXENTO" },
      { cantidad: "2", precioUnitario: "750", tipoImpuesto: "IVA_8" },
    ]);

    // subtotal: 1000 + 500 + 1500 = 3000
    expect(t.subtotal.toFixed(5)).toBe("3000.00000");
    // IVA 13%: 130, IVA 8%: 120, exento: 0
    expect(t.totalImpuesto.toFixed(5)).toBe("250.00000");
    expect(t.total.toFixed(5)).toBe("3250.00000");
    expect(t.impuestoPorTarifa["13"].toFixed(5)).toBe("130.00000");
    expect(t.impuestoPorTarifa["8"].toFixed(5)).toBe("120.00000");
    expect(t.impuestoPorTarifa["0"]).toBeDefined(); // exento también aparece
  });

  it("factura todo exento — sin IVA", () => {
    const t = calcularTotales([
      { cantidad: "5", precioUnitario: "200", tipoImpuesto: "EXENTO" },
    ]);
    expect(t.totalImpuesto.toFixed(5)).toBe("0.00000");
    expect(t.total.toFixed(5)).toBe("1000.00000");
  });

  it("factura con descuentos acumulados", () => {
    const t = calcularTotales([
      { cantidad: "1", precioUnitario: "1000", descuentoPct: "10", tipoImpuesto: "IVA_13" },
      { cantidad: "1", precioUnitario: "1000", descuentoPct: "20", tipoImpuesto: "IVA_13" },
    ]);
    // descuento total: 100 + 200 = 300
    expect(t.descuento.toFixed(5)).toBe("300.00000");
    // base: 900 + 800 = 1700 → IVA 13%: 221
    expect(t.totalImpuesto.toFixed(5)).toBe("221.00000");
    expect(t.total.toFixed(5)).toBe("1921.00000");
  });

  it("suma correcta con múltiples líneas IVA 13%", () => {
    const t = calcularTotales([
      { cantidad: "1", precioUnitario: "1000", tipoImpuesto: "IVA_13" },
      { cantidad: "1", precioUnitario: "1000", tipoImpuesto: "IVA_13" },
    ]);
    // IVA total agrupado en tarifa 13%
    expect(t.impuestoPorTarifa["13"].toFixed(5)).toBe("260.00000");
  });

  it("factura con 0% sin crédito (código 11) se agrupa en tarifa 0", () => {
    const t = calcularTotales([
      { cantidad: "1", precioUnitario: "100", tipoImpuesto: "IVA_0_SIN_CREDITO" },
      { cantidad: "1", precioUnitario: "100", tipoImpuesto: "EXENTO" },
    ]);
    expect(t.totalImpuesto.toFixed(5)).toBe("0.00000");
    expect(t.total.toFixed(5)).toBe("200.00000");
  });

  it("rechaza factura sin líneas", () => {
    expect(() => calcularTotales([])).toThrow("La factura debe tener al menos una línea");
  });

  it("factura tipo agroalimentaria — varias tarifas bajas", () => {
    // Caso real: lácteos exentos + sal con IVA 1% + otros con IVA 13%
    const t = calcularTotales([
      { cantidad: "10", precioUnitario: "800", tipoImpuesto: "EXENTO" },    // leche
      { cantidad: "2", precioUnitario: "1200", tipoImpuesto: "IVA_1" },     // sal
      { cantidad: "1", precioUnitario: "5000", tipoImpuesto: "IVA_13" },   // otros
    ]);
    // subtotal: 8000 + 2400 + 5000 = 15400
    expect(t.subtotal.toFixed(5)).toBe("15400.00000");
    // IVA: 0 + 24 + 650 = 674
    expect(t.totalImpuesto.toFixed(5)).toBe("674.00000");
    expect(t.impuestoPorTarifa["1"].toFixed(5)).toBe("24.00000");
    expect(t.impuestoPorTarifa["13"].toFixed(5)).toBe("650.00000");
  });
});
