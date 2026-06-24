import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { obtenerRutas } from "./actions";
import Link from "next/link";
import { Plus, MapPin, Users, Truck } from "lucide-react";

const DIAS_CORTO: Record<string, string> = {
  lunes: "L", martes: "M", miércoles: "X", jueves: "J",
  viernes: "V", sábado: "S", domingo: "D",
};

export default async function RutasPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const rutas = await obtenerRutas();
  const activas = rutas.filter((r) => r.activa).length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rutas</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activas} ruta{activas !== 1 ? "s" : ""} activa{activas !== 1 ? "s" : ""} · {rutas.length} total
          </p>
        </div>
        <Link
          href="/rutas/nueva"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva ruta
        </Link>
      </div>

      {/* Grid de tarjetas */}
      {rutas.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center space-y-3">
          <MapPin className="h-10 w-10 text-gray-300 mx-auto" />
          <p className="text-gray-500">No hay rutas registradas.</p>
          <Link href="/rutas/nueva" className="inline-block text-sm text-emerald-600 font-medium">
            Crear la primera ruta →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rutas.map((ruta) => (
            <Link
              key={ruta.id}
              href={`/rutas/${ruta.id}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-emerald-200 transition-all group block"
            >
              {/* Header tarjeta */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h2 className={`font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors truncate ${!ruta.activa ? "text-gray-400" : ""}`}>
                    {ruta.nombre}
                  </h2>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{ruta.codigo}</p>
                </div>
                <span className={`shrink-0 ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                  ruta.activa
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}>
                  {ruta.activa ? "Activa" : "Inactiva"}
                </span>
              </div>

              {/* Días */}
              <div className="flex gap-1 mb-4">
                {["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"].map((dia) => (
                  <span
                    key={dia}
                    className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${
                      ruta.dias?.includes(dia)
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-50 text-gray-300"
                    }`}
                  >
                    {DIAS_CORTO[dia]}
                  </span>
                ))}
              </div>

              {/* Info */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span>{ruta.totalClientes} cliente{ruta.totalClientes !== 1 ? "s" : ""}</span>
                </div>
                {ruta.responsableNombre && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="h-3.5 w-3.5 shrink-0 text-center">👤</span>
                    <span className="truncate">{ruta.responsableNombre}</span>
                  </div>
                )}
                {ruta.vehiculo && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Truck className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{ruta.vehiculo}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
