import { describe, it, expect } from "vitest";
import {
  generarConsecutivo,
  validarConsecutivo,
  parsearConsecutivo,
} from "@/domain/facturacion/consecutivo";

describe("generarConsecutivo — longitud y formato", () => {
  it("genera exactamente 20 dígitos", () => {
    const c = generarConsecutivo({ tipo: "FE", secuencia: 1 });
    expect(c).toHaveLength(20);
  });

  it("contiene solo dígitos numéricos", () => {
    const c = generarConsecutivo({ tipo: "FE", secuencia: 1 });
    expect(/^\d{20}$/.test(c)).toBe(true);
  });
});

describe("generarConsecutivo — tipos de comprobante", () => {
  const casos: Array<{ tipo: Parameters<typeof generarConsecutivo>[0]["tipo"]; codigo: string }> = [
    { tipo: "FE", codigo: "01" },
    { tipo: "ND", codigo: "02" },
    { tipo: "NC", codigo: "03" },
    { tipo: "TE", codigo: "04" },
    { tipo: "FEC", codigo: "08" },
    { tipo: "FEE", codigo: "09" },
    { tipo: "REP", codigo: "10" },
  ];

  for (const { tipo, codigo } of casos) {
    it(`${tipo} → código ${codigo} en posición 8-9`, () => {
      const c = generarConsecutivo({ tipo, secuencia: 1 });
      expect(c.slice(8, 10)).toBe(codigo);
    });
  }

  it("NORMAL lanza error — no tiene consecutivo de Hacienda", () => {
    expect(() =>
      generarConsecutivo({ tipo: "NORMAL" as Parameters<typeof generarConsecutivo>[0]["tipo"], secuencia: 1 })
    ).toThrow();
  });
});

describe("generarConsecutivo — estructura de campos", () => {
  it("sucursal por defecto es 001 (posiciones 0-2)", () => {
    const c = generarConsecutivo({ tipo: "FE", secuencia: 1 });
    expect(c.slice(0, 3)).toBe("001");
  });

  it("terminal por defecto es 00001 (posiciones 3-7)", () => {
    const c = generarConsecutivo({ tipo: "FE", secuencia: 1 });
    expect(c.slice(3, 8)).toBe("00001");
  });

  it("secuencia se almacena en posiciones 10-19 (10 dígitos)", () => {
    const c = generarConsecutivo({ tipo: "FE", secuencia: 1 });
    expect(c.slice(10, 20)).toBe("0000000001");
  });

  it("secuencia grande se rellena sin truncar", () => {
    const c = generarConsecutivo({ tipo: "FE", secuencia: 9_999_999_999 });
    expect(c.slice(10, 20)).toBe("9999999999");
  });

  it("sucursal personalizada", () => {
    const c = generarConsecutivo({ sucursal: 5, tipo: "TE", secuencia: 100 });
    expect(c.slice(0, 3)).toBe("005");
  });

  it("terminal personalizada", () => {
    const c = generarConsecutivo({ terminal: 3, tipo: "FE", secuencia: 1 });
    expect(c.slice(3, 8)).toBe("00003");
  });

  it("todos los campos configurados", () => {
    const c = generarConsecutivo({ sucursal: 2, terminal: 10, tipo: "NC", secuencia: 500 });
    expect(c.slice(0, 3)).toBe("002");
    expect(c.slice(3, 8)).toBe("00010");
    expect(c.slice(8, 10)).toBe("03"); // NC
    expect(c.slice(10, 20)).toBe("0000000500");
    expect(c).toHaveLength(20);
  });
});

describe("generarConsecutivo — validaciones", () => {
  it("rechaza secuencia 0", () => {
    expect(() => generarConsecutivo({ tipo: "FE", secuencia: 0 })).toThrow("Secuencia inválida");
  });

  it("rechaza secuencia negativa", () => {
    expect(() => generarConsecutivo({ tipo: "FE", secuencia: -1 })).toThrow();
  });

  it("rechaza secuencia que excede 10 dígitos", () => {
    expect(() =>
      generarConsecutivo({ tipo: "FE", secuencia: 10_000_000_000 })
    ).toThrow("Secuencia inválida");
  });

  it("rechaza sucursal 0", () => {
    expect(() =>
      generarConsecutivo({ sucursal: 0, tipo: "FE", secuencia: 1 })
    ).toThrow("Sucursal inválida");
  });

  it("rechaza sucursal mayor a 999", () => {
    expect(() =>
      generarConsecutivo({ sucursal: 1000, tipo: "FE", secuencia: 1 })
    ).toThrow("Sucursal inválida");
  });

  it("rechaza terminal 0", () => {
    expect(() =>
      generarConsecutivo({ terminal: 0, tipo: "FE", secuencia: 1 })
    ).toThrow("Terminal inválida");
  });

  it("rechaza terminal mayor a 99999", () => {
    expect(() =>
      generarConsecutivo({ terminal: 100000, tipo: "FE", secuencia: 1 })
    ).toThrow("Terminal inválida");
  });
});

describe("validarConsecutivo", () => {
  it("valida un consecutivo correcto", () => {
    const c = generarConsecutivo({ tipo: "FE", secuencia: 1 });
    const r = validarConsecutivo(c);
    expect(r.valido).toBe(true);
    expect(r.errores).toHaveLength(0);
  });

  it("rechaza longitud incorrecta", () => {
    const r = validarConsecutivo("001");
    expect(r.valido).toBe(false);
  });

  it("rechaza caracteres no numéricos", () => {
    const r = validarConsecutivo("001000010100000000A0");
    expect(r.valido).toBe(false);
  });
});

describe("parsearConsecutivo", () => {
  it("parsea todos los campos correctamente", () => {
    const c = generarConsecutivo({ sucursal: 2, terminal: 3, tipo: "FE", secuencia: 42 });
    const p = parsearConsecutivo(c);
    expect(p.sucursal).toBe("002");
    expect(p.terminal).toBe("00003");
    expect(p.tipoCodigo).toBe("01");
    expect(p.secuencia).toBe(42);
  });
});
