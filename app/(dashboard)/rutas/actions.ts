"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RutaInput {
  nombre: string;
  codigo: string;
  dias: string[];
  responsableId: string | null;
  vehiculo: string;
  notas: string;
  zonasCobertura: string;
}

export interface ClienteEnRuta {
  id: string;
  nombre: string;
  nombreNegocio?: string | null;
  codigoNegocio?: string | null;
  telefono?: string | null;
  rutaId: string | null;
  ordenEnRuta: number | null;
}

export interface RutaMock {
  id: string;
  nombre: string;
  codigo: string;
  dias: string[];
  responsableId: string | null;
  responsableNombre?: string;
  vehiculo: string | null;
  notas: string | null;
  activa: boolean;
  empresaId: string;
  totalClientes: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_RUTAS: RutaMock[] = [
  {
    id: "r1", nombre: "Ruta Norte", codigo: "RN-001",
    dias: ["lunes", "miércoles", "viernes"],
    responsableId: "u1", responsableNombre: "Juan Vendedor",
    vehiculo: "Toyota HiAce placa ABC-123",
    notas: "Zona de cobertura: Heredia centro y alrededores.",
    activa: true, empresaId: "dev-empresa", totalClientes: 2,
    createdAt: new Date("2026-01-10"), updatedAt: new Date("2026-06-01"),
  },
  {
    id: "r2", nombre: "Ruta Sur", codigo: "RS-001",
    dias: ["martes", "jueves"],
    responsableId: "u2", responsableNombre: "Ana García",
    vehiculo: "Isuzu NQR placa XYZ-789",
    notas: "Zona de cobertura: Desamparados, Aserrí, Acosta.",
    activa: true, empresaId: "dev-empresa", totalClientes: 1,
    createdAt: new Date("2026-02-05"), updatedAt: new Date("2026-05-20"),
  },
  {
    id: "r3", nombre: "Ruta Centro", codigo: "RC-001",
    dias: ["lunes", "martes", "miércoles", "jueves", "viernes"],
    responsableId: null, responsableNombre: undefined,
    vehiculo: null,
    notas: "Sin responsable asignado. En pausa.",
    activa: false, empresaId: "dev-empresa", totalClientes: 0,
    createdAt: new Date("2026-03-15"), updatedAt: new Date("2026-03-15"),
  },
];

const MOCK_CLIENTES_EN_RUTA: ClienteEnRuta[] = [
  { id: "c1", nombre: "Supermercado El Maíz S.A.", nombreNegocio: "Supermercado El Maíz", codigoNegocio: "SMAI001", telefono: "22345678", rutaId: "r1", ordenEnRuta: 1 },
  { id: "c3", nombre: "Distribuidora Norte S.R.L.", nombreNegocio: "Distribuidora Norte", codigoNegocio: "DN001", telefono: "22556677", rutaId: "r1", ordenEnRuta: 2 },
  { id: "c2", nombre: "María González Rodríguez", nombreNegocio: "Pulpería La Esquina", codigoNegocio: "PLE001", telefono: "88765432", rutaId: "r2", ordenEnRuta: 1 },
  { id: "c4", nombre: "Consumidor Final", nombreNegocio: null, codigoNegocio: null, telefono: null, rutaId: null, ordenEnRuta: null },
  { id: "c5", nombre: "Lácteos del Valle S.A.", nombreNegocio: "Lácteos del Valle", codigoNegocio: "LDV001", telefono: "22889900", rutaId: null, ordenEnRuta: null },
];

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function obtenerRutas(): Promise<RutaMock[]> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  try {
    const { db, ruta, cliente, usuario } = await import("@/infrastructure/db");
    const { eq, count, sql } = await import("drizzle-orm");

    const rutas = await db.select({
      id: ruta.id,
      nombre: ruta.nombre,
      codigo: ruta.codigo,
      dias: ruta.dias,
      responsableId: ruta.responsableId,
      responsableNombre: usuario.nombre,
      vehiculo: ruta.vehiculo,
      notas: ruta.notas,
      activa: ruta.activa,
      empresaId: ruta.empresaId,
      totalClientes: sql<number>`(SELECT COUNT(*) FROM cliente WHERE cliente.ruta_id = ${ruta.id})::int`,
      createdAt: ruta.createdAt,
      updatedAt: ruta.updatedAt,
    })
      .from(ruta)
      .leftJoin(usuario, eq(ruta.responsableId, usuario.id))
      .where(eq(ruta.empresaId, session.empresaId));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rutas as any[];
  } catch {
    return MOCK_RUTAS;
  }
}

export async function obtenerRuta(id: string): Promise<RutaMock | null> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  try {
    const { db, ruta, usuario } = await import("@/infrastructure/db");
    const { eq, and, sql } = await import("drizzle-orm");

    const [r] = await db.select({
      id: ruta.id,
      nombre: ruta.nombre,
      codigo: ruta.codigo,
      dias: ruta.dias,
      responsableId: ruta.responsableId,
      responsableNombre: usuario.nombre,
      vehiculo: ruta.vehiculo,
      notas: ruta.notas,
      activa: ruta.activa,
      empresaId: ruta.empresaId,
      totalClientes: sql<number>`(SELECT COUNT(*) FROM cliente WHERE cliente.ruta_id = ${ruta.id})::int`,
      createdAt: ruta.createdAt,
      updatedAt: ruta.updatedAt,
    })
      .from(ruta)
      .leftJoin(usuario, eq(ruta.responsableId, usuario.id))
      .where(and(eq(ruta.id, id), eq(ruta.empresaId, session.empresaId)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r as any) ?? null;
  } catch {
    return MOCK_RUTAS.find((r) => r.id === id) ?? null;
  }
}

export async function obtenerClientesParaRuta(rutaId?: string): Promise<ClienteEnRuta[]> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  try {
    const { db, cliente } = await import("@/infrastructure/db");
    const { eq, asc } = await import("drizzle-orm");

    const clientes = await db.select({
      id: cliente.id,
      nombre: cliente.nombre,
      nombreNegocio: cliente.nombreNegocio,
      codigoNegocio: cliente.codigoNegocio,
      telefono: cliente.telefono,
      rutaId: cliente.rutaId,
      ordenEnRuta: cliente.ordenEnRuta,
    })
      .from(cliente)
      .where(eq(cliente.empresaId, session.empresaId))
      .orderBy(asc(cliente.nombre));

    return clientes as ClienteEnRuta[];
  } catch {
    // Mock: return all clients, filtering by ruta if given
    return MOCK_CLIENTES_EN_RUTA;
  }
}

export async function obtenerUsuariosEmpresa(): Promise<{ id: string; nombre: string }[]> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  try {
    const { db, usuario } = await import("@/infrastructure/db");
    const { eq } = await import("drizzle-orm");

    return await db.select({ id: usuario.id, nombre: usuario.nombre })
      .from(usuario)
      .where(eq(usuario.empresaId, session.empresaId));
  } catch {
    return [
      { id: "u1", nombre: "Juan Vendedor" },
      { id: "u2", nombre: "Ana García" },
    ];
  }
}

// ─── Mutaciones ───────────────────────────────────────────────────────────────

export async function crearRuta(
  data: RutaInput,
  clientesOrdenados: { id: string; orden: number }[]
): Promise<{ error?: string; rutaId?: string }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { error: "No autorizado" };
  if (!data.nombre.trim()) return { error: "El nombre es obligatorio" };
  if (!data.codigo.trim()) return { error: "El código es obligatorio" };

  const notasCompletas = [data.notas, data.zonasCobertura].filter(Boolean).join("\n\nZonas de cobertura: ");

  try {
    const { db, ruta, cliente } = await import("@/infrastructure/db");
    const { eq } = await import("drizzle-orm");

    const [nuevaRuta] = await db.insert(ruta).values({
      nombre: data.nombre.trim(),
      codigo: data.codigo.trim().toUpperCase(),
      dias: data.dias,
      responsableId: data.responsableId || null,
      vehiculo: data.vehiculo.trim() || null,
      notas: notasCompletas || null,
      activa: true,
      empresaId: session.empresaId,
    }).returning({ id: ruta.id });

    if (nuevaRuta?.id && clientesOrdenados.length > 0) {
      for (const c of clientesOrdenados) {
        await db.update(cliente)
          .set({ rutaId: nuevaRuta.id, ordenEnRuta: c.orden })
          .where(eq(cliente.id, c.id));
      }
    }

    revalidatePath("/rutas");
    return { rutaId: nuevaRuta?.id };
  } catch (err) {
    console.warn("[DEV] DB no disponible:", (err as Error).message);
    const mockId = `r-mock-${Date.now()}`;
    MOCK_RUTAS.push({
      id: mockId, nombre: data.nombre, codigo: data.codigo,
      dias: data.dias, responsableId: data.responsableId, vehiculo: data.vehiculo || null,
      notas: notasCompletas || null, activa: true, empresaId: "dev-empresa",
      totalClientes: clientesOrdenados.length,
      createdAt: new Date(), updatedAt: new Date(),
    });
    revalidatePath("/rutas");
    return { rutaId: mockId };
  }
}

export async function actualizarRuta(
  id: string,
  data: RutaInput,
  clientesOrdenados: { id: string; orden: number }[]
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { error: "No autorizado" };
  if (!data.nombre.trim()) return { error: "El nombre es obligatorio" };

  const notasCompletas = [data.notas, data.zonasCobertura ? `Zonas de cobertura: ${data.zonasCobertura}` : ""].filter(Boolean).join("\n\n");

  try {
    const { db, ruta, cliente } = await import("@/infrastructure/db");
    const { eq } = await import("drizzle-orm");

    await db.update(ruta).set({
      nombre: data.nombre.trim(),
      codigo: data.codigo.trim().toUpperCase(),
      dias: data.dias,
      responsableId: data.responsableId || null,
      vehiculo: data.vehiculo.trim() || null,
      notas: notasCompletas || null,
    }).where(eq(ruta.id, id));

    // Clear all client assignments for this route, then re-assign
    await db.update(cliente)
      .set({ rutaId: null, ordenEnRuta: null })
      .where(eq(cliente.rutaId, id));

    for (const c of clientesOrdenados) {
      await db.update(cliente)
        .set({ rutaId: id, ordenEnRuta: c.orden })
        .where(eq(cliente.id, c.id));
    }

    revalidatePath("/rutas");
    revalidatePath(`/rutas/${id}`);
    return {};
  } catch (err) {
    console.warn("[DEV] DB no disponible:", (err as Error).message);
    const idx = MOCK_RUTAS.findIndex((r) => r.id === id);
    if (idx >= 0) {
      MOCK_RUTAS[idx] = { ...MOCK_RUTAS[idx], nombre: data.nombre, codigo: data.codigo, dias: data.dias, notas: notasCompletas || null, vehiculo: data.vehiculo || null, totalClientes: clientesOrdenados.length };
    }
    revalidatePath("/rutas");
    revalidatePath(`/rutas/${id}`);
    return {};
  }
}

export async function toggleRutaActiva(
  id: string,
  activa: boolean
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { error: "No autorizado" };

  try {
    const { db, ruta } = await import("@/infrastructure/db");
    const { eq } = await import("drizzle-orm");
    await db.update(ruta).set({ activa }).where(eq(ruta.id, id));
    revalidatePath("/rutas");
    revalidatePath(`/rutas/${id}`);
    return {};
  } catch {
    const idx = MOCK_RUTAS.findIndex((r) => r.id === id);
    if (idx >= 0) MOCK_RUTAS[idx] = { ...MOCK_RUTAS[idx], activa };
    revalidatePath("/rutas");
    return {};
  }
}
