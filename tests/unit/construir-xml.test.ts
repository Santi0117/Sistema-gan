import { describe, it, expect } from "vitest";
import {
  construirXML,
  calcularTotalesXML,
  tipoPagoAMedioPago,
  tipoPagoACondicionVenta,
  tipoIdAHacienda,
  type FacturaXMLInput,
} from "@/domain/hacienda/construir-xml";
import { calcularTotales } from "@/domain/facturacion/calcular-totales";
import { validarXML } from "@/domain/hacienda/validar-xsd";

// ─── Fixture base ─────────────────────────────────────────────────────────────

const BASE_INPUT: FacturaXMLInput = {
  tipoComprobante: "FE",
  clave: "50623062631012345678000100100100000000011234567890",
  consecutivo: "00100100100000000001",
  fechaEmision: new Date("2026-06-23T10:30:00-06:00"),
  emisor: {
    nombre: "Ganadera El Prado S.A.",
    tipoIdentificacion: "02",
    numeroIdentificacion: "3101000000",
    nombreComercial: "Ganadera El Prado",
    actividadEconomica: "0121",
    correoElectronico: "facturacion@ganaderaprado.cr",
    provincia: "01",
    canton: "0101",
    distrito: "010101",
    otrasSenas: "San José centro",
    telefono: "22234567",
  },
  receptor: {
    nombre: "Supermercado El Maíz S.A.",
    tipoIdentificacion: "02",
    numeroIdentificacion: "3102000000",
    correoElectronico: "compras@elmaiz.cr",
  },
  condicionVenta: "01",
  medioPago: ["01"],
  lineas: [
    {
      numeroLinea: 1,
      codigoCabys: "1010100010100",
      descripcion: "Leche entera 1L",
      unidadMedida: "Unid",
      cantidad: "10.000",
      precioUnitario: "1000.00000",
      montoTotal: "10000.00000",
      subTotal: "10000.00000",
      baseImponible: "10000.00000",
      tipoImpuesto: "IVA_13",
      montoImpuesto: "1300.00000",
      montoTotalLinea: "11300.00000",
    },
    {
      numeroLinea: 2,
      codigoCabys: "2020200020200",
      descripcion: "Pan integral",
      unidadMedida: "Unid",
      cantidad: "5.000",
      precioUnitario: "800.00000",
      montoTotal: "4000.00000",
      subTotal: "4000.00000",
      baseImponible: "0.00000",
      tipoImpuesto: "EXENTO",
      montoImpuesto: "0.00000",
      montoTotalLinea: "4000.00000",
    },
  ],
  moneda: "CRC",
  tipoCambio: "1.00000",
  totales: {
    totalServGravados: "0.00000",
    totalServExentos: "0.00000",
    totalServExonerado: "0.00000",
    totalMercanciasGravadas: "10000.00000",
    totalMercanciasExentas: "4000.00000",
    totalMercanciasExoneradas: "0.00000",
    totalGravado: "10000.00000",
    totalExento: "4000.00000",
    totalExonerado: "0.00000",
    totalVenta: "14000.00000",
    totalDescuentos: "0.00000",
    totalVentaNeta: "14000.00000",
    totalImpuesto: "1300.00000",
    totalComprobante: "15300.00000",
  },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("construirXML", () => {
  it("genera XML con declaración y elemento raíz correcto para FE", () => {
    const xml = construirXML(BASE_INPUT);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<FacturaElectronica");
    expect(xml).toContain("facturaElectronica");
    expect(xml).toContain("</FacturaElectronica>");
  });

  it("incluye la clave numérica de 50 dígitos", () => {
    const xml = construirXML(BASE_INPUT);
    expect(xml).toContain(`<Clave>${BASE_INPUT.clave}</Clave>`);
    const match = xml.match(/<Clave>(\d+)<\/Clave>/);
    expect(match?.[1]).toHaveLength(50);
  });

  it("incluye el consecutivo de 20 dígitos", () => {
    const xml = construirXML(BASE_INPUT);
    expect(xml).toContain(`<NumeroConsecutivo>${BASE_INPUT.consecutivo}</NumeroConsecutivo>`);
    const match = xml.match(/<NumeroConsecutivo>(\d+)<\/NumeroConsecutivo>/);
    expect(match?.[1]).toHaveLength(20);
  });

  it("incluye datos del emisor", () => {
    const xml = construirXML(BASE_INPUT);
    expect(xml).toContain("<Emisor>");
    expect(xml).toContain("<Nombre>Ganadera El Prado S.A.</Nombre>");
    expect(xml).toContain("<Tipo>02</Tipo>");
    expect(xml).toContain("<Numero>3101000000</Numero>");
    expect(xml).toContain("<CorreoElectronico>facturacion@ganaderaprado.cr</CorreoElectronico>");
  });

  it("incluye datos del receptor", () => {
    const xml = construirXML(BASE_INPUT);
    expect(xml).toContain("<Receptor>");
    expect(xml).toContain("<Nombre>Supermercado El Maíz S.A.</Nombre>");
    expect(xml).toContain("<Numero>3102000000</Numero>");
  });

  it("genera impuesto correcto para IVA_13", () => {
    const xml = construirXML(BASE_INPUT);
    expect(xml).toContain("<Codigo>07</Codigo>");
    expect(xml).toContain("<CodigoTarifa>06</CodigoTarifa>");
    expect(xml).toContain("<Tarifa>13.000</Tarifa>");
    expect(xml).toContain("<Monto>1300.00000</Monto>");
  });

  it("no genera elemento Impuesto para líneas EXENTO", () => {
    const xml = construirXML(BASE_INPUT);
    const lineas = xml.match(/<LineaDetalle>[\s\S]*?<\/LineaDetalle>/g) ?? [];
    expect(lineas).toHaveLength(2);
    // Segunda línea (EXENTO) no debe tener Impuesto
    expect(lineas[1]).not.toContain("<Impuesto>");
  });

  it("genera TotalComprobante correcto en ResumenFactura", () => {
    const xml = construirXML(BASE_INPUT);
    expect(xml).toContain("<TotalComprobante>15300.00000</TotalComprobante>");
  });

  it("genera root element correcto para TE", () => {
    const xml = construirXML({ ...BASE_INPUT, tipoComprobante: "TE" });
    expect(xml).toContain("<TiqueteElectronico");
    expect(xml).toContain("</TiqueteElectronico>");
  });

  it("genera root element correcto para NC", () => {
    const xml = construirXML({
      ...BASE_INPUT,
      tipoComprobante: "NC",
      referencia: {
        tipoDoc: "01",
        numero: BASE_INPUT.clave,
        fechaEmision: "2026-06-20T10:00:00-06:00",
        codigo: "01",
        razon: "Anulación de factura",
      },
    });
    expect(xml).toContain("<NotaCreditoElectronica");
    expect(xml).toContain("<InformacionReferencia>");
    expect(xml).toContain("<Razon>Anulación de factura</Razon>");
  });

  it("lanza error para tipo NORMAL", () => {
    expect(() => construirXML({ ...BASE_INPUT, tipoComprobante: "NORMAL" }))
      .toThrow("no genera XML electrónico");
  });

  it("incluye descuento en la línea cuando montoDescuento > 0", () => {
    const input: FacturaXMLInput = {
      ...BASE_INPUT,
      lineas: [
        {
          ...BASE_INPUT.lineas[0],
          montoTotal: "10000.00000",
          descuentoMonto: "500.00000",
          descuentoNaturaleza: "Descuento por volumen",
          subTotal: "9500.00000",
          baseImponible: "9500.00000",
          montoImpuesto: "1235.00000",
          montoTotalLinea: "10735.00000",
        },
      ],
    };
    const xml = construirXML(input);
    expect(xml).toContain("<Descuento>");
    expect(xml).toContain("<MontoDescuento>500.00000</MontoDescuento>");
    expect(xml).toContain("<NaturalezaDescuento>Descuento por volumen</NaturalezaDescuento>");
  });

  it("incluye código CABYS en la línea", () => {
    const xml = construirXML(BASE_INPUT);
    expect(xml).toContain("<Codigo>1010100010100</Codigo>");
  });

  it("incluye Normativa con resolución", () => {
    const xml = construirXML(BASE_INPUT);
    expect(xml).toContain("<Normativa>");
    expect(xml).toContain("<NumeroResolucion>");
  });

  it("escapa caracteres especiales XML en descripción", () => {
    const xml = construirXML({
      ...BASE_INPUT,
      lineas: [{ ...BASE_INPUT.lineas[0], descripcion: "Producto <especial> & 'comillas'" }],
    });
    expect(xml).toContain("&lt;especial&gt;");
    expect(xml).toContain("&amp;");
    expect(xml).not.toContain("<especial>");
  });

  it("genera la fecha en timezone -06:00 (Costa Rica)", () => {
    const xml = construirXML(BASE_INPUT);
    const match = xml.match(/<FechaEmision>(.*?)<\/FechaEmision>/);
    expect(match?.[1]).toMatch(/-06:00$/);
  });
});

// ─── calcularTotalesXML ───────────────────────────────────────────────────────

describe("calcularTotalesXML", () => {
  it("calcula totales correctamente para líneas mixtas", () => {
    const lineasInput = [
      { cantidad: "10", precioUnitario: "1000", descuentoPct: "0", tipoImpuesto: "IVA_13" as const },
      { cantidad: "5", precioUnitario: "800", descuentoPct: "0", tipoImpuesto: "EXENTO" as const },
    ];
    const totales = calcularTotales(lineasInput);
    const xml = calcularTotalesXML(totales, totales.lineas);

    expect(xml.totalMercanciasGravadas).toBe("10000.00000");
    expect(xml.totalMercanciasExentas).toBe("4000.00000");
    expect(xml.totalImpuesto).toBe("1300.00000");
    expect(xml.totalComprobante).toBe("15300.00000");
  });
});

// ─── validarXML ──────────────────────────────────────────────────────────────

describe("validarXML con XML generado", () => {
  it("XML generado pasa la validación estructural", () => {
    const xml = construirXML(BASE_INPUT);
    const resultado = validarXML(xml);
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });

  it("detecta clave con longitud incorrecta", () => {
    const xml = construirXML({ ...BASE_INPUT, clave: "1234" });
    const resultado = validarXML(xml);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.some((e) => e.includes("Clave"))).toBe(true);
  });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

describe("tipoPagoAMedioPago", () => {
  it("mapea CONTADO → 01", () => expect(tipoPagoAMedioPago("CONTADO")).toBe("01"));
  it("mapea TARJETA → 02", () => expect(tipoPagoAMedioPago("TARJETA")).toBe("02"));
  it("mapea TRANSFERENCIA → 04", () => expect(tipoPagoAMedioPago("TRANSFERENCIA")).toBe("04"));
  it("mapea SINPE_MOVIL → 06", () => expect(tipoPagoAMedioPago("SINPE_MOVIL")).toBe("06"));
  it("mapea PLATAFORMA_DIGITAL → 07", () => expect(tipoPagoAMedioPago("PLATAFORMA_DIGITAL")).toBe("07"));
  it("mapea CREDITO → 99", () => expect(tipoPagoAMedioPago("CREDITO")).toBe("99"));
});

describe("tipoPagoACondicionVenta", () => {
  it("CREDITO → 02", () => expect(tipoPagoACondicionVenta("CREDITO")).toBe("02"));
  it("CONTADO → 01", () => expect(tipoPagoACondicionVenta("CONTADO")).toBe("01"));
  it("TARJETA → 01", () => expect(tipoPagoACondicionVenta("TARJETA")).toBe("01"));
});

describe("tipoIdAHacienda", () => {
  it("FISICA → 01", () => expect(tipoIdAHacienda("FISICA")).toBe("01"));
  it("JURIDICA → 02", () => expect(tipoIdAHacienda("JURIDICA")).toBe("02"));
  it("DIMEX → 03", () => expect(tipoIdAHacienda("DIMEX")).toBe("03"));
  it("NITE → 04", () => expect(tipoIdAHacienda("NITE")).toBe("04"));
  it("GENERICO → undefined", () => expect(tipoIdAHacienda("GENERICO")).toBeUndefined());
});
