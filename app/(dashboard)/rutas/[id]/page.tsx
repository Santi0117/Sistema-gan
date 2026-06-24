import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { obtenerRuta, obtenerClientesParaRuta, toggleRutaActiva } from "../actions";
import Link from "next/link";
import { ArrowLeft, Edit, MapPin, Users, Truck, CalendarDays } from "lucide-react";

const DIAS_CORTO: Record<string, string> = {
  lunes: "L", martes: "M", miércoles: "X", jueves: "J",
  viernes: "V", sábado: "S", domingo: "D",
};

interface Props { params: Promise<{ id: string }> }

export default async function DetalleRutaPage({ params }: Props) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const { id } = await params;
  const [ruta, todosClientes] = await Promise.all([
    obtenerRuta(id),
    obtenerClientesParaRuta(id),
  ]);
  if (!ruta) notFound();

  const clientesEnRuta = todosClientes
    .filter((c) => c.rutaId === id)
    .sort((a, b) => (a.ordenEnRuta ?? 0) - (b.ordenEnRuta ?? 0));

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Cabecera */}
      <div className="flex items-start gap-3">
        <Link href="/rutas" className="mt-1 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className={`text-2xl font-bold ${ruta.activa ? "text-gray-900" : "text-gray-400"}`}>
            {ruta.nombre}
          </h1>
          <p className="text-sm text-gray-400 font-mono mt-0.5">{ruta.codigo}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            ruta.activa ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {ruta.activa ? "Activa" : "Inactiva"}
          </span>
          <Link
            href={`/rutas/${id}/editar`}
            className="flex items-center gap-1.5 px-3 py-2 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
          >
            <Edit className="h-3.5 w-3.5" /> Editar
          </Link>
        </div>
      </div>

      {/* Datos generales */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-700 text-xs uppercase tracking-wide">Datos generales</h2>

        {/* Días */}
        <div>
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Días de operación</p>
          <div className="flex gap-1.5">
            {Object.entries(DIAS_CORTO).map(([dia, corto]) => (
              <span
                key={dia}
                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${
                  ruta.dias?.includes(dia)
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-50 text-gray-300"
                }`}
                title={dia}
              >
                {corto}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ruta.responsableNombre && (
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Responsable</p>
                <p className="text-sm text-gray-800">{ruta.responsableNombre}</p>
              </div>
            </div>
          )}
          {ruta.vehiculo && (
            <div className="flex items-start gap-2">
              <Truck className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Vehículo</p>
                <p className="text-sm text-gray-800">{ruta.vehiculo}</p>
              </div>
            </div>
          )}
        </div>

        {ruta.notas && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Notas</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{ruta.notas}</p>
          </div>
        )}
      </div>

      {/* Clientes en la ruta */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700 text-xs uppercase tracking-wide flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Orden de visita
          </h2>
          <span className="text-xs text-gray-400">{clientesEnRuta.length} cliente{clientesEnRuta.length !== 1 ? "s" : ""}</span>
        </div>

        {clientesEnRuta.length === 0 ? (
          <div className="px-5 py-8 text-center space-y-2">
            <p className="text-sm text-gray-400">Sin clientes asignados.</p>
            <Link href={`/rutas/${id}/editar`} className="text-sm text-orange-600 font-medium">
              Asignar clientes →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {clientesEnRuta.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{c.nombre}</p>
                  <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                    {c.nombreNegocio && <span>{c.nombreNegocio}</span>}
                    {c.codigoNegocio && <span>· {c.codigoNegocio}</span>}
                    {c.telefono && <span>· {c.telefono}</span>}
                  </div>
                </div>
                <Link
                  href={`/clientes/${c.id}`}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium shrink-0"
                >
                  Ver →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Facturas de esta ruta */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-3">Comprobantes</h2>
        <Link
          href={`/ventas?ruta=${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          Ver comprobantes de esta ruta →
        </Link>
      </div>

      {/* Toggle activa */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-3">Estado</h2>
        <form action={async () => {
          "use server";
          await toggleRutaActiva(id, !ruta.activa);
        }}>
          <button
            type="submit"
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              ruta.activa
                ? "border-red-200 text-red-600 hover:bg-red-50"
                : "border-green-200 text-green-700 hover:bg-green-50"
            }`}
          >
            {ruta.activa ? "Desactivar ruta" : "Activar ruta"}
          </button>
        </form>
      </div>
    </div>
  );
}
