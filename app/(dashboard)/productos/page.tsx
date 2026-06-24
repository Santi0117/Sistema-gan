import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { obtenerProductos } from "./actions";
import Link from "next/link";
import { Plus, Package, AlertTriangle } from "lucide-react";
import { Decimal } from "decimal.js";
import { TIPOS_IMPUESTO_LABEL } from "@/lib/zod-schemas";
import type { TIPOS_IMPUESTO } from "@/lib/zod-schemas";

type TipoImpuesto = (typeof TIPOS_IMPUESTO)[number];

interface SearchParams {
  q?: string;
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const { q } = await searchParams;
  const productos = await obtenerProductos(q);

  const stockBajoCount = productos.filter(
    (p) =>
      p.activo &&
      p.controlarStock &&
      new Decimal(p.stockActual ?? "0").lt(new Decimal(p.stockMinimo ?? "0"))
  ).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {productos.length} producto{productos.length !== 1 ? "s" : ""}
            {q ? ` encontrados para "${q}"` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/productos/nuevo"
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Link>
        </div>
      </div>

      {/* Alerta stock bajo */}
      {stockBajoCount > 0 && !q && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
          <span className="text-sm text-orange-800">
            <strong>{stockBajoCount}</strong> producto{stockBajoCount !== 1 ? "s" : ""} con stock bajo.{" "}
            <Link href="/inventario" className="underline hover:text-orange-900">
              Ver inventario
            </Link>
          </span>
        </div>
      )}

      {/* Barra de búsqueda */}
      <form method="get" className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por código o nombre…"
            className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          Buscar
        </button>
        {q && (
          <Link
            href="/productos"
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg"
          >
            Limpiar
          </Link>
        )}
      </form>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {productos.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Package className="h-10 w-10 text-gray-300 mx-auto" />
            <p className="text-gray-500">
              {q ? `Sin resultados para "${q}".` : "Aún no hay productos registrados."}
            </p>
            {!q && (
              <Link
                href="/productos/nuevo"
                className="inline-block text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Crear el primer producto →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Código</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Categoría</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Precio venta</th>
                  <th className="px-4 py-3 font-medium text-gray-600">IVA</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Stock</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productos.map((p) => {
                  const stock = new Decimal(p.stockActual ?? "0");
                  const minimo = new Decimal(p.stockMinimo ?? "0");
                  const stockBajo = p.controlarStock && stock.lt(minimo);
                  const sinStock = p.controlarStock && stock.lte(0);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.codigo}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/productos/${p.id}`}
                          className="font-medium text-gray-800 hover:text-orange-600"
                        >
                          {p.nombre}
                        </Link>
                        {p.codigoCabys && (
                          <p className="text-xs text-gray-400 font-mono">{p.codigoCabys}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.categoria ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        ₡{new Decimal(p.precioVenta).toDecimalPlaces(2).toNumber().toLocaleString("es-CR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {TIPOS_IMPUESTO_LABEL[p.tipoImpuesto as TipoImpuesto] ?? p.tipoImpuesto}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.controlarStock ? (
                          <span
                            className={`font-medium ${
                              sinStock
                                ? "text-red-600"
                                : stockBajo
                                  ? "text-orange-500"
                                  : "text-gray-700"
                            }`}
                          >
                            {stock.toNumber()} {p.unidadMedida}
                            {stockBajo && !sinStock && (
                              <AlertTriangle className="inline h-3.5 w-3.5 ml-1 text-orange-400" />
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Sin control</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            p.activo
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/productos/${p.id}`}
                          className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
