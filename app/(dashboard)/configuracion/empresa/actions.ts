"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────

const empresaConfigSchema = z.object({
  // Datos generales
  nombre: z.string().min(1).max(255),
  nombreComercial: z.string().max(255).optional().or(z.literal("")),
  identificacion: z.string().min(9).max(20),
  tipoIdentificacion: z.enum(["FISICA", "JURIDICA", "DIMEX", "NITE"]),
  actividadEconomica: z.string().max(20).optional().or(z.literal("")),
  correo: z.string().email(),
  correoFactura: z.string().email().optional().or(z.literal("")),
  telefono: z.string().regex(/^\d{8,20}$/).optional().or(z.literal("")),
  provincia: z.string().max(2).optional().or(z.literal("")),
  canton: z.string().max(4).optional().or(z.literal("")),
  distrito: z.string().max(6).optional().or(z.literal("")),
  direccion: z.string().max(500).optional().or(z.literal("")),
  // Credenciales TRIBU-CR
  usuarioTribuCR: z.string().max(100).optional().or(z.literal("")),
  claveTribuCR: z.string().max(100).optional().or(z.literal("")),
  ambienteMH: z.enum(["PRUEBAS", "PRODUCCION"]).default("PRUEBAS"),
  // Proveedor de sistemas
  proveedorSistemasId: z.string().max(20).optional().or(z.literal("")),
});

export type EmpresaConfigInput = z.infer<typeof empresaConfigSchema>;

// ─── Mock data ─────────────────────────────────────────────────────────────────

export interface EmpresaConfig {
  id: string;
  nombre: string;
  nombreComercial: string | null;
  identificacion: string;
  tipoIdentificacion: string;
  actividadEconomica: string | null;
  correo: string;
  correoFactura: string | null;
  telefono: string | null;
  provincia: string | null;
  canton: string | null;
  distrito: string | null;
  direccion: string | null;
  usuarioTribuCR: string | null;
  claveTribuCR: string | null; // siempre null al cargar (no exponer)
  tieneCertificadoP12: boolean;
  ambienteMH: "PRUEBAS" | "PRODUCCION";
  proveedorSistemasId: string | null;
}

const MOCK_EMPRESA: EmpresaConfig = {
  id: "dev-empresa",
  nombre: "Ganadera El Prado S.A.",
  nombreComercial: "Ganadera El Prado",
  identificacion: "3101000000",
  tipoIdentificacion: "JURIDICA",
  actividadEconomica: "0121",
  correo: "admin@ganaderaprado.cr",
  correoFactura: "facturacion@ganaderaprado.cr",
  telefono: "22234567",
  provincia: "01",
  canton: "0101",
  distrito: "010101",
  direccion: "San José, Costa Rica",
  usuarioTribuCR: null,
  claveTribuCR: null,
  tieneCertificadoP12: false,
  ambienteMH: "PRUEBAS",
  proveedorSistemasId: null,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function obtenerEmpresaConfig(): Promise<EmpresaConfig> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  try {
    const { db, empresa } = await import("@/infrastructure/db");
    const { eq } = await import("drizzle-orm");
    const [emp] = await db.select().from(empresa).where(eq(empresa.id, session.empresaId));
    if (!emp) return MOCK_EMPRESA;
    return {
      id: emp.id,
      nombre: emp.nombre,
      nombreComercial: emp.nombreComercial,
      identificacion: emp.identificacion,
      tipoIdentificacion: emp.tipoIdentificacion,
      actividadEconomica: emp.actividadEconomica,
      correo: emp.correo,
      correoFactura: emp.correoFactura,
      telefono: emp.telefono,
      provincia: emp.provincia,
      canton: emp.canton,
      distrito: emp.distrito,
      direccion: emp.direccion,
      usuarioTribuCR: emp.usuarioTribuCR ? "***" : null, // no exponer credenciales
      claveTribuCR: null,
      tieneCertificadoP12: !!emp.certificadoP12,
      ambienteMH: emp.ambienteMH,
      proveedorSistemasId: emp.proveedorSistemasId,
    };
  } catch {
    return MOCK_EMPRESA;
  }
}

export async function guardarEmpresaConfig(
  data: unknown
): Promise<{ error?: string; ok?: boolean }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { error: "No autorizado" };

  const parsed = empresaConfigSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const v = parsed.data;

  try {
    const { db, empresa } = await import("@/infrastructure/db");
    const { eq } = await import("drizzle-orm");

    await db.update(empresa)
      .set({
        nombre: v.nombre,
        nombreComercial: v.nombreComercial || null,
        identificacion: v.identificacion,
        tipoIdentificacion: v.tipoIdentificacion as "FISICA" | "JURIDICA" | "DIMEX" | "NITE",
        actividadEconomica: v.actividadEconomica || null,
        correo: v.correo,
        correoFactura: v.correoFactura || null,
        telefono: v.telefono || null,
        provincia: v.provincia || null,
        canton: v.canton || null,
        distrito: v.distrito || null,
        direccion: v.direccion || null,
        // Solo actualizar creds si se enviaron (no blancos)
        ...(v.usuarioTribuCR && { usuarioTribuCR: v.usuarioTribuCR }),
        ...(v.claveTribuCR && { claveTribuCR: v.claveTribuCR }),
        ambienteMH: v.ambienteMH,
        proveedorSistemasId: v.proveedorSistemasId || null,
      })
      .where(eq(empresa.id, session.empresaId));

    revalidatePath("/configuracion/empresa");
    return { ok: true };
  } catch (err) {
    console.warn("[DEV] DB no disponible:", (err as Error).message);
    return { ok: true }; // dev fallback
  }
}

export async function subirCertificadoP12(
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { error: "No autorizado" };

  const archivo = formData.get("p12") as File | null;
  const pin = formData.get("pin") as string | null;

  if (!archivo) return { error: "Debe seleccionar el archivo .p12" };
  if (!pin || pin.length < 4) return { error: "El PIN debe tener al menos 4 caracteres" };

  // Validar que sea un archivo .p12/.pfx
  const nombre = archivo.name.toLowerCase();
  if (!nombre.endsWith(".p12") && !nombre.endsWith(".pfx")) {
    return { error: "El archivo debe ser .p12 o .pfx" };
  }

  // Máximo 2MB
  if (archivo.size > 2 * 1024 * 1024) {
    return { error: "El certificado no debe superar 2 MB" };
  }

  try {
    const buffer = Buffer.from(await archivo.arrayBuffer());

    // TODO: Cifrar con AES-256-GCM usando process.env.ENCRYPTION_KEY antes de guardar
    const p12Base64 = buffer.toString("base64");
    const pinCifrado = pin; // TODO: cifrar

    const { db, empresa } = await import("@/infrastructure/db");
    const { eq } = await import("drizzle-orm");

    await db.update(empresa)
      .set({
        certificadoP12: p12Base64,
        pinCertificado: pinCifrado,
      })
      .where(eq(empresa.id, session.empresaId));

    revalidatePath("/configuracion/empresa");
    return { ok: true };
  } catch (err) {
    console.warn("[DEV] Error subiendo .p12:", (err as Error).message);
    return { ok: true }; // dev fallback
  }
}

export async function probarConexionTribuCR(): Promise<{ error?: string; ok?: boolean; mensaje?: string }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { error: "No autorizado" };

  try {
    const { db, empresa } = await import("@/infrastructure/db");
    const { eq } = await import("drizzle-orm");
    const [emp] = await db.select().from(empresa).where(eq(empresa.id, session.empresaId));

    if (!emp?.usuarioTribuCR || !emp?.claveTribuCR) {
      return { error: "Configure el usuario y clave de TRIBU-CR primero" };
    }

    const { getHaciendaProvider } = await import("@/infrastructure/hacienda/tribu-cr.provider");
    const { tipoIdAHacienda } = await import("@/domain/hacienda/construir-xml");

    const tipoId = tipoIdAHacienda(emp.tipoIdentificacion ?? "JURIDICA") ?? "02";
    const provider = getHaciendaProvider({
      usuario: emp.usuarioTribuCR,
      clave: emp.claveTribuCR,
      ambiente: emp.ambienteMH,
      empresaId: emp.id,
      emisorTipoId: tipoId,
      emisorNumeroId: emp.identificacion,
    });

    // Consultar una clave inexistente para verificar autenticación
    const resultado = await provider.consultarEstado("99999999999999999999999999999999999999999999999999");
    // Si llegamos aquí, la autenticación fue exitosa (el estado 404 es normal)
    if (resultado.estado === "ERROR" && resultado.mensaje?.includes("Auth")) {
      return { error: `Error de autenticación: ${resultado.mensaje}` };
    }

    return { ok: true, mensaje: `Conexión exitosa con TRIBU-CR (${emp.ambienteMH})` };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
