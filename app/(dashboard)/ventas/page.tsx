import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { obtenerFacturas } from "./actions";
import { TablaComprobantes } from "@/components/ventas/tabla-comprobantes";
import Link from "next/link";
import { Plus, FileText, AlertCircle } from "lucide-react";
import Decimal from "decimal.js";
import { Suspense } from "react";

interface Props {
  searchParams: Promise<{
    tipo?: string;
    estado?: string;
    estadoMH?: string;
    pago?: string;
    desde?: string;
    hasta?: string;
  }>;
}

export default async function VentasPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const [facturas, filtros] = await Promise.all([
    obtenerFacturas(),
    searchParams,
  ]);

  const pendientesMH = facturas.filter(
    (f) => f.estadoMH === "PENDIENTE" || f.estadoMH === "ERROR"
  ).length;

  const totalMes = facturas.reduce(
    (acc, f) => acc.plus(new Decimal(f.total ?? "0")),
    new Decimal(0)
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comprobantes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {facturas.length} comprobante{facturas.length !== 1 ? "s" : ""} este mes
          </p>
        </div>
        <Link
          href="/ventas/nueva"
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva factura
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total del mes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ₡{totalMes.toDecimalPlaces(0).toNumber().toLocaleString("es-CR")}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Comprobantes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{facturas.length}</p>
        </div>
        <div className={`border rounded-xl p-5 ${pendientesMH > 0 ? "bg-orange-50 border-orange-200" : "bg-white border-gray-200"}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Pendientes MH</p>
          <p className={`text-2xl font-bold mt-1 ${pendientesMH > 0 ? "text-orange-600" : "text-gray-900"}`}>
            {pendientesMH}
          </p>
        </div>
      </div>

      {/* Alerta pendientes */}
      {pendientesMH > 0 && (
        <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">{pendientesMH} comprobante{pendientesMH !== 1 ? "s" : ""} pendiente{pendientesMH !== 1 ? "s" : ""} de envío a Hacienda.</span>
            <p className="text-xs mt-0.5 text-orange-700">
              Use el botón "Enviar a Hacienda" en cada comprobante individual. No se realizan envíos masivos.
            </p>
          </div>
        </div>
      )}

      {/* Tabla con filtros */}
      {facturas.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="text-center py-16 space-y-3">
            <FileText className="h-10 w-10 text-gray-300 mx-auto" />
            <p className="text-gray-500">No hay comprobantes este mes.</p>
            <Link href="/ventas/nueva" className="inline-block text-sm text-orange-600 font-medium">
              Emitir la primera factura →
            </Link>
          </div>
        </div>
      ) : (
        <Suspense fallback={<div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">Cargando…</div>}>
          <TablaComprobantes facturas={facturas} filtros={filtros} />
        </Suspense>
      )}
    </div>
  );
}
