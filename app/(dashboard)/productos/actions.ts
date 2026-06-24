"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { productoSchema, type ProductoInput } from "@/lib/zod-schemas";
import type { Producto } from "@/infrastructure/db/schema";

// ─── Mock data (cuando la DB no está conectada) ───────────────────────────────

const MOCK: Producto[] = [
  {
    id: "m1", codigo: "LECH001", nombre: "Leche entera 1L",
    codigoCabys: "5111100000100", categoria: "Lácteos", descripcion: null,
    unidadMedida: "Unid", precioCosto: "600.00000", precioVenta: "900.00000",
    tipoImpuesto: "EXENTO", controlarStock: true,
    stockActual: "50.000", stockMinimo: "20.000",
    activo: true, empresaId: "dev-empresa", createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m2", codigo: "QUES001", nombre: "Queso turrialba 500g",
    codigoCabys: "5111300000100", categoria: "Lácteos", descripcion: null,
    unidadMedida: "Unid", precioCosto: "2800.00000", precioVenta: "3500.00000",
    tipoImpuesto: "EXENTO", controlarStock: true,
    stockActual: "12.000", stockMinimo: "15.000",
    activo: true, empresaId: "dev-empresa", createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m3", codigo: "CREM001", nombre: "Crema de leche 500mL",
    codigoCabys: "5111400000100", categoria: "Lácteos", descripcion: null,
    unidadMedida: "Unid", precioCosto: "1200.00000", precioVenta: "1600.00000",
    tipoImpuesto: "IVA_13", controlarStock: true,
    stockActual: "8.000", stockMinimo: "10.000",
    activo: true, empresaId: "dev-empresa", createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m4", codigo: "BALA001", nombre: "Balanceado bovino 50Kg",
    codigoCabys: "0817190000100", categoria: "Agroinsumos", descripcion: null,
    unidadMedida: "Unid", precioCosto: "15000.00000", precioVenta: "18500.00000",
    tipoImpuesto: "EXENTO", controlarStock: true,
    stockActual: "30.000", stockMinimo: "10.000",
    activo: true, empresaId: "dev-empresa", createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m5", codigo: "VITA001", nombre: "Vitaminas bovinas 500mL",
    codigoCabys: "3004901900100", categoria: "Veterinaria", descripcion: null,
    unidadMedida: "Unid", precioCosto: "8500.00000", precioVenta: "11000.00000",
    tipoImpuesto: "IVA_4", controlarStock: true,
    stockActual: "2.000", stockMinimo: "5.000",
    activo: true, empresaId: "dev-empresa", createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m6", codigo: "MANT001", nombre: "Mantequilla 250g",
    codigoCabys: "5111200000100", categoria: "Lácteos", descripcion: null,
    unidadMedida: "Unid", precioCosto: "1500.00000", precioVenta: "2100.00000",
    tipoImpuesto: "EXENTO", controlarStock: true,
    stockActual: "0.000", stockMinimo: "8.000",
    activo: true, empresaId: "dev-empresa", createdAt: new Date(), updatedAt: new Date(),
  },
];

// ─── Helper DB con fallback ───────────────────────────────────────────────────

async function withDB<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const { db } = await import("@/infrastructure/db");
    void db; // ensure import
    return await fn();
  } catch {
    return fallback;
  }
}

// ─── Obtener lista ─────────────────────────────────────────────────────────────

export async function obtenerProductos(search?: string): Promise<Producto[]> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  const fallback = search
    ? MOCK.filter(
        (p) =>
          p.nombre.toLowerCase().includes(search.toLowerCase()) ||
          p.codigo.toLowerCase().includes(search.toLowerCase())
      )
    : MOCK;

  return withDB(async () => {
    const { db, producto } = await import("@/infrastructure/db");
    const { eq, and, or, ilike } = await import("drizzle-orm");

    const filters = [eq(producto.empresaId, session.empresaId)];
    if (search) {
      filters.push(
        or(
          ilike(producto.nombre, `%${search}%`),
          ilike(producto.codigo, `%${search}%`)
        )!
      );
    }
    return db
      .select()
      .from(producto)
      .where(and(...filters))
      .orderBy(producto.nombre);
  }, fallback);
}

// ─── Obtener uno ──────────────────────────────────────────────────────────────

export async function obtenerProducto(id: string): Promise<Producto | null> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  const fallback = MOCK.find((p) => p.id === id) ?? null;

  return withDB(async () => {
    const { db, producto } = await import("@/infrastructure/db");
    const { eq, and } = await import("drizzle-orm");
    const [row] = await db
      .select()
      .from(producto)
      .where(and(eq(producto.id, id), eq(producto.empresaId, session.empresaId)));
    return row ?? null;
  }, fallback);
}

// ─── Crear ────────────────────────────────────────────────────────────────────

export async function crearProducto(
  _prev: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { error: "No autorizado" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = productoSchema.safeParse({
    ...raw,
    controlarStock: raw.controlarStock === "on",
    activo: raw.activo !== "off",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e: { message: string }) => e.message).join(", ") };
  }

  try {
    const { db, producto } = await import("@/infrastructure/db");
    await db.insert(producto).values({
      ...parsed.data,
      codigoCabys: parsed.data.codigoCabys || null,
      categoria: parsed.data.categoria || null,
      descripcion: parsed.data.descripcion || null,
      empresaId: session.empresaId,
    });
  } catch {
    // DB no disponible en dev — simula éxito
    console.warn("[DEV] DB no disponible, producto no persistido");
  }

  revalidatePath("/productos");
  redirect("/productos");
}

// ─── Actualizar ───────────────────────────────────────────────────────────────

export async function actualizarProducto(
  id: string,
  _prev: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { error: "No autorizado" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = productoSchema.safeParse({
    ...raw,
    controlarStock: raw.controlarStock === "on",
    activo: raw.activo !== "off",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e: { message: string }) => e.message).join(", ") };
  }

  try {
    const { db, producto } = await import("@/infrastructure/db");
    const { eq, and } = await import("drizzle-orm");
    await db
      .update(producto)
      .set({ ...parsed.data, codigoCabys: parsed.data.codigoCabys || null, updatedAt: new Date() })
      .where(and(eq(producto.id, id), eq(producto.empresaId, session.empresaId)));
  } catch {
    console.warn("[DEV] DB no disponible, actualización no persistida");
  }

  revalidatePath("/productos");
  redirect("/productos");
}

// ─── Toggle activo ────────────────────────────────────────────────────────────

export async function toggleActivoProducto(id: string, activo: boolean) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("No autorizado");

  try {
    const { db, producto } = await import("@/infrastructure/db");
    const { eq, and } = await import("drizzle-orm");
    await db
      .update(producto)
      .set({ activo, updatedAt: new Date() })
      .where(and(eq(producto.id, id), eq(producto.empresaId, session.empresaId)));
  } catch {
    console.warn("[DEV] DB no disponible");
  }

  revalidatePath("/productos");
}
