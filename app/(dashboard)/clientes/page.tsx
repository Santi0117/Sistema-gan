import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { obtenerClientes } from "./actions";
import Link from "next/link";
import { Plus, Users, AlertTriangle } from "lucide-react";
import { TIPOS_ID_CLIENTE_LABEL } from "@/lib/zod-schemas";
import type { TIPOS_ID_CLIENTE } from "@/lib/zod-schemas";
import { Decimal } from "decimal.js";

type TipoId = (typeof TIPOS_ID_CLIENTE)[number];

interface SearchParams { q?: string }

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const { q } = await searchParams;
  const clientes = await obtenerClientes(q);

  const conCreditoVencido = clientes.filter(
    (c) => c.tieneCredito && c.activo && c.diasCredito && c.diasCredito < 0
  ).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {clientes.length} cliente{clientes.length !== 1 ? "s" : ""}
            {q ? ` encontrados para "${q}"` : ""}
          </p>
        </div>
        <Link
          href="/clientes/nuevo"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Link>
      </div>

      {/* Búsqueda */}
      <form method="get" className="flex gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, cédula o negocio…"
          className="flex-1 max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          autoComplete="off"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          Buscar
        </button>
        {q && (
          <Link href="/clientes" className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg">
            Limpiar
          </Link>
        )}
      </form>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {clientes.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Users className="h-10 w-10 text-gray-300 mx-auto" />
            <p className="text-gray-500">
              {q ? `Sin resultados para "${q}".` : "Aún no hay clientes registrados."}
            </p>
            {!q && (
              <Link
                href="/clientes/nuevo"
                className="inline-block text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Crear el primer cliente →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Identificación</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Teléfono</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Correo</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Crédito</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clientes.map((c) => {
                  const tipo = c.tipoIdentificacion as TipoId;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/clientes/${c.id}`}
                          className="font-medium text-gray-800 hover:text-emerald-600"
                        >
                          {c.nombre}
                        </Link>
                        {c.nombreNegocio && c.nombreNegocio !== c.nombre && (
                          <p className="text-xs text-gray-400">{c.nombreNegocio}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-500">
                          {TIPOS_ID_CLIENTE_LABEL[tipo] ?? tipo}
                        </p>
                        {c.identificacion && (
                          <p className="font-mono text-xs text-gray-700">{c.identificacion}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {c.telefono ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {c.correoContacto ?? c.correoFactura ?? (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {c.tieneCredito ? (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {c.diasCredito} días · ₡
                            {new Decimal(c.limiteCredito ?? "0")
                              .toDecimalPlaces(0)
                              .toNumber()
                              .toLocaleString("es-CR")}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            c.activo
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {c.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/clientes/${c.id}`}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
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
