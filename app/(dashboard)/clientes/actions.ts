"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { clienteSchema } from "@/lib/zod-schemas";
import type { Cliente } from "@/infrastructure/db/schema";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK: Cliente[] = [
  {
    id: "c1", tipoIdentificacion: "JURIDICA", identificacion: "3101123456",
    nombre: "Supermercado El Maíz S.A.", nombreNegocio: "Supermercado El Maíz",
    codigoNegocio: "SMAI001", responsable: "Juan Pérez",
    telefono: "22345678", correoContacto: "compras@elmaiz.cr",
    correosAdicionales: [], correoFactura: "facturas@elmaiz.cr",
    actividadEconomicaReceptor: "4711", pais: "CR",
    provincia: "1", canton: "101", distrito: "10101",
    direccion: "100m norte del Mercado Central, San José",
    tieneCredito: true, diasCredito: 30, limiteCredito: "500000.00000",
    contribuyente: true, activo: true, rutaId: null, ordenEnRuta: null,
    empresaId: "dev-empresa", createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "c2", tipoIdentificacion: "FISICA", identificacion: "109870456",
    nombre: "María González Rodríguez", nombreNegocio: "Pulpería La Esquina",
    codigoNegocio: "PLE001", responsable: null,
    telefono: "88765432", correoContacto: "mariagonzalez@gmail.com",
    correosAdicionales: [], correoFactura: null,
    actividadEconomicaReceptor: "4711", pais: "CR",
    provincia: "2", canton: "201", distrito: "20101",
    direccion: "De la escuela 200m este, Alajuela centro",
    tieneCredito: false, diasCredito: 0, limiteCredito: "0.00000",
    contribuyente: true, activo: true, rutaId: null, ordenEnRuta: null,
    empresaId: "dev-empresa", createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "c3", tipoIdentificacion: "JURIDICA", identificacion: "3102056789",
    nombre: "Distribuidora Norte S.R.L.", nombreNegocio: "Distribuidora Norte",
    codigoNegocio: "DNOR001", responsable: "Carlos Mora",
    telefono: "24567890", correoContacto: "info@dnorte.cr",
    correosAdicionales: ["compras@dnorte.cr"], correoFactura: "facturas@dnorte.cr",
    actividadEconomicaReceptor: "4639", pais: "CR",
    provincia: "4", canton: "401", distrito: "40101",
    direccion: "Barrio Los Ángeles, 50m sur del parque, Heredia",
    tieneCredito: true, diasCredito: 15, limiteCredito: "250000.00000",
    contribuyente: true, activo: true, rutaId: null, ordenEnRuta: null,
    empresaId: "dev-empresa", createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "c4", tipoIdentificacion: "GENERICO", identificacion: null,
    nombre: "Consumidor Final", nombreNegocio: null,
    codigoNegocio: null, responsable: null,
    telefono: null, correoContacto: null,
    correosAdicionales: [], correoFactura: null,
    actividadEconomicaReceptor: null, pais: "CR",
    provincia: null, canton: null, distrito: null,
    direccion: null,
    tieneCredito: false, diasCredito: 0, limiteCredito: "0.00000",
    contribuyente: false, activo: true, rutaId: null, ordenEnRuta: null,
    empresaId: "dev-empresa", createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "c5", tipoIdentificacion: "JURIDICA", identificacion: "3101987654",
    nombre: "Coopeleche R.L.", nombreNegocio: "Coopeleche",
    codigoNegocio: "COOP001", responsable: "Ana Quesada",
    telefono: "22987654", correoContacto: "gerencia@coopeleche.cr",
    correosAdicionales: ["compras@coopeleche.cr", "contabilidad@coopeleche.cr"],
    correoFactura: "facturas@coopeleche.cr",
    actividadEconomicaReceptor: "1050", pais: "CR",
    provincia: "3", canton: "305", distrito: "30501",
    direccion: "Turrialba centro, 200m sur del estadio",
    tieneCredito: true, diasCredito: 60, limiteCredito: "1000000.00000",
    contribuyente: true, activo: true, rutaId: null, ordenEnRuta: null,
    empresaId: "dev-empresa", createdAt: new Date(), updatedAt: new Date(),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function withDB<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const { db } = await import("@/infrastructure/db");
    void db;
    return await fn();
  } catch {
    return fallback;
  }
}

// ─── Obtener lista ─────────────────────────────────────────────────────────────

export async function obtenerClientes(search?: string): Promise<Cliente[]> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  const fallback = search
    ? MOCK.filter(
        (c) =>
          c.nombre.toLowerCase().includes(search.toLowerCase()) ||
          (c.identificacion?.includes(search) ?? false) ||
          (c.nombreNegocio?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : MOCK;

  return withDB(async () => {
    const { db, cliente } = await import("@/infrastructure/db");
    const { eq, and, or, ilike } = await import("drizzle-orm");

    const filters = [eq(cliente.empresaId, session.empresaId)];
    if (search) {
      filters.push(
        or(
          ilike(cliente.nombre, `%${search}%`),
          ilike(cliente.identificacion, `%${search}%`)
        )!
      );
    }
    return db.select().from(cliente).where(and(...filters)).orderBy(cliente.nombre);
  }, fallback);
}

// ─── Obtener uno ──────────────────────────────────────────────────────────────

export async function obtenerCliente(id: string): Promise<Cliente | null> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  const fallback = MOCK.find((c) => c.id === id) ?? null;

  return withDB(async () => {
    const { db, cliente } = await import("@/infrastructure/db");
    const { eq, and } = await import("drizzle-orm");
    const [row] = await db
      .select()
      .from(cliente)
      .where(and(eq(cliente.id, id), eq(cliente.empresaId, session.empresaId)));
    return row ?? null;
  }, fallback);
}

// ─── Crear ────────────────────────────────────────────────────────────────────

export async function crearCliente(data: unknown): Promise<{ error?: string; id?: string }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { error: "No autorizado" };

  const parsed = clienteSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { correosAdicionales, ...rest } = parsed.data;

  try {
    const { db, cliente } = await import("@/infrastructure/db");
    const [row] = await db
      .insert(cliente)
      .values({
        ...rest,
        identificacion: rest.identificacion || null,
        nombreNegocio: rest.nombreNegocio || null,
        codigoNegocio: rest.codigoNegocio || null,
        responsable: rest.responsable || null,
        telefono: rest.telefono || null,
        correoContacto: rest.correoContacto || null,
        correoFactura: rest.correoFactura || null,
        actividadEconomicaReceptor: rest.actividadEconomicaReceptor || null,
        provincia: rest.provincia || null,
        canton: rest.canton || null,
        distrito: rest.distrito || null,
        direccion: rest.direccion || null,
        rutaId: rest.rutaId || null,
        correosAdicionales,
        empresaId: session.empresaId,
      })
      .returning({ id: cliente.id });
    revalidatePath("/clientes");
    return { id: row?.id };
  } catch {
    console.warn("[DEV] DB no disponible, cliente no persistido");
    revalidatePath("/clientes");
    return { id: "mock-new" };
  }
}

// ─── Actualizar ───────────────────────────────────────────────────────────────

export async function actualizarCliente(
  id: string,
  data: unknown
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { error: "No autorizado" };

  const parsed = clienteSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { correosAdicionales, ...rest } = parsed.data;

  try {
    const { db, cliente } = await import("@/infrastructure/db");
    const { eq, and } = await import("drizzle-orm");
    await db
      .update(cliente)
      .set({
        ...rest,
        identificacion: rest.identificacion || null,
        correosAdicionales,
        updatedAt: new Date(),
      })
      .where(and(eq(cliente.id, id), eq(cliente.empresaId, session.empresaId)));
  } catch {
    console.warn("[DEV] DB no disponible, actualización no persistida");
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}
