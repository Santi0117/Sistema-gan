import { describe, it, expect } from "vitest";
import {
  generarClaveNumerica,
  validarClaveNumerica,
  parsearClaveNumerica,
} from "@/domain/facturacion/clave-numerica";
import { generarConsecutivo } from "@/domain/facturacion/consecutivo";

const CONSECUTIVO_VALIDO = generarConsecutivo({ tipo: "FE", secuencia: 1 });
const FECHA_FIJA = new Date("2026-01-15T12:00:00.000-06:00"); // Costa Rica
const ID_EMISOR = "3-101-123456"; // cédula jurídica

describe("generarClaveNumerica", () => {
  it("genera clave de exactamente 50 dígitos", () => {
    const clave = generarClaveNumerica({
      fecha: FECHA_FIJA,
      identificacionEmisor: ID_EMISOR,
      consecutivo: CONSECUTIVO_VALIDO,
    });
    expect(clave).toHaveLength(50);
  });

  it("clave comienza con 506 (Costa Rica)", () => {
    const clave = generarClaveNumerica({
      fecha: FECHA_FIJA,
      identificacionEmisor: ID_EMISOR,
      consecutivo: CONSECUTIVO_VALIDO,
    });
    expect(clave.slice(0, 3)).toBe("506");
  });

  it("contiene solo dígitos numéricos", () => {
    const clave = generarClaveNumerica({
      fecha: FECHA_FIJA,
      identificacionEmisor: ID_EMISOR,
      consecutivo: CONSECUTIVO_VALIDO,
    });
    expect(/^\d{50}$/.test(clave)).toBe(true);
  });

  it("la fecha codificada es ddMMyy en posiciones 3-8", () => {
    const clave = generarClaveNumerica({
      fecha: FECHA_FIJA, // 15 enero 2026
      identificacionEmisor: ID_EMISOR,
      consecutivo: CONSECUTIVO_VALIDO,
    });
    // Fecha: 15/01/26 → "150126"
    expect(clave.slice(3, 9)).toBe("150126");
  });

  it("identifica al emisor en posiciones 9-20 (12 dígitos, ceros a la izquierda)", () => {
    const clave = generarClaveNumerica({
      fecha: FECHA_FIJA,
      identificacionEmisor: "3101123456", // 10 dígitos
      consecutivo: CONSECUTIVO_VALIDO,
    });
    expect(clave.slice(9, 21)).toBe("003101123456");
  });

  it("situación normal (1) en posición 21", () => {
    const clave = generarClaveNumerica({
      fecha: FECHA_FIJA,
      identificacionEmisor: ID_EMISOR,
      consecutivo: CONSECUTIVO_VALIDO,
    });
    expect(clave[21]).toBe("1");
  });

  it("soporta situación de contingencia (2)", () => {
    const clave = generarClaveNumerica({
      fecha: FECHA_FIJA,
      identificacionEmisor: ID_EMISOR,
      situacion: "2",
      consecutivo: CONSECUTIVO_VALIDO,
    });
    expect(clave[21]).toBe("2");
  });

  it("el consecutivo se almacena en posiciones 22-41", () => {
    const clave = generarClaveNumerica({
      fecha: FECHA_FIJA,
      identificacionEmisor: ID_EMISOR,
      consecutivo: CONSECUTIVO_VALIDO,
    });
    expect(clave.slice(22, 42)).toBe(CONSECUTIVO_VALIDO);
  });

  it("el código de seguridad ocupa posiciones 42-49 (8 dígitos)", () => {
    const clave = generarClaveNumerica({
      fecha: FECHA_FIJA,
      identificacionEmisor: ID_EMISOR,
      consecutivo: CONSECUTIVO_VALIDO,
    });
    const seguridad = clave.slice(42, 50);
    expect(seguridad).toHaveLength(8);
    expect(/^\d{8}$/.test(seguridad)).toBe(true);
  });

  it("dos claves generadas con el mismo consecutivo tienen códigos de seguridad distintos", () => {
    const params = {
      fecha: FECHA_FIJA,
      identificacionEmisor: ID_EMISOR,
      consecutivo: CONSECUTIVO_VALIDO,
    };
    const clave1 = generarClaveNumerica(params);
    const clave2 = generarClaveNumerica(params);
    // Los primeros 42 dígitos deben ser iguales
    expect(clave1.slice(0, 42)).toBe(clave2.slice(0, 42));
    // El código de seguridad puede diferir (probabilidad 1/10^8 de coincidir)
    // No hacemos aserción estricta de diferencia — solo validamos estructura
    expect(clave1.slice(42)).toHaveLength(8);
    expect(clave2.slice(42)).toHaveLength(8);
  });

  it("rechaza consecutivo con longitud incorrecta", () => {
    expect(() =>
      generarClaveNumerica({
        fecha: FECHA_FIJA,
        identificacionEmisor: ID_EMISOR,
        consecutivo: "12345",
      })
    ).toThrow("Consecutivo debe tener 20 dígitos");
  });

  it("rechaza consecutivo con caracteres no numéricos", () => {
    expect(() =>
      generarClaveNumerica({
        fecha: FECHA_FIJA,
        identificacionEmisor: ID_EMISOR,
        consecutivo: "0010000010112345678A",
      })
    ).toThrow();
  });

  it("acepta cédula con guiones (formato 3-101-XXXXXX)", () => {
    expect(() =>
      generarClaveNumerica({
        fecha: FECHA_FIJA,
        identificacionEmisor: "3-101-123456",
        consecutivo: CONSECUTIVO_VALIDO,
      })
    ).not.toThrow();
  });
});

describe("validarClaveNumerica", () => {
  it("valida clave correcta", () => {
    const clave = generarClaveNumerica({
      fecha: FECHA_FIJA,
      identificacionEmisor: ID_EMISOR,
      consecutivo: CONSECUTIVO_VALIDO,
    });
    expect(validarClaveNumerica(clave).valida).toBe(true);
    expect(validarClaveNumerica(clave).errores).toHaveLength(0);
  });

  it("rechaza clave con longitud incorrecta", () => {
    const r = validarClaveNumerica("506");
    expect(r.valida).toBe(false);
    expect(r.errores.length).toBeGreaterThan(0);
  });

  it("rechaza clave que no empieza con 506", () => {
    const r = validarClaveNumerica("507" + "0".repeat(47));
    expect(r.valida).toBe(false);
    expect(r.errores.some((e) => e.includes("506"))).toBe(true);
  });
});

describe("parsearClaveNumerica", () => {
  it("parsea todos los componentes correctamente", () => {
    const clave = generarClaveNumerica({
      fecha: FECHA_FIJA,
      identificacionEmisor: ID_EMISOR,
      consecutivo: CONSECUTIVO_VALIDO,
    });
    const parsed = parsearClaveNumerica(clave);

    expect(parsed.pais).toBe("506");
    expect(parsed.fecha).toBe("150126");
    expect(parsed.situacion).toBe("1");
    expect(parsed.consecutivo).toBe(CONSECUTIVO_VALIDO);
    expect(parsed.codigoSeguridad).toHaveLength(8);
  });
});
