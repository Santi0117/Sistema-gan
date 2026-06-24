import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { obtenerFacturas } from "./actions";
import Link from "next/link";
import { Plus, FileText, AlertCircle } from "lucide-react";
import { Decimal } from "decimal.js";

const ESTADO_MH: Record<string, { label: string; color: string }> = {
  NO_APLICA: { label: "N/A", color: "bg-gray-100 text-gray-500" },
  PENDIENTE: { label: "Pendiente", color: "bg-orange-100 text-orange-700" },
  EN_PROCESO: { label: "En proceso", color: "bg-blue-100 text-blue-700" },
  ACEPTADA: { label: "Aceptada", color: "bg-green-100 text-green-700" },
  RECHAZADA: { label: "Rechazada", color: "bg-red-100 text-red-700" },
  ERROR: { label: "Error", color: "bg-red-100 text-red-700" },
};

const TIPO_COMPROBANTE: Record<string, string> = {
  FE: "Factura Elect.", TE: "Tiquete Elect.", ND: "Nota Débito",
  NC: "Nota Crédito", FEC: "F. Compra", REP: "Recibo Pago", NORMAL: "Factura Local",
};

const TIPO_PAGO: Record<string, string> = {
  CONTADO: "Contado", CREDITO: "Crédito", TRANSFERENCIA: "Transferencia",
  SINPE_MOVIL: "SINPE Móvil", TARJETA: "Tarjeta", PLATAFORMA_DIGITAL: "Digital",
  EFECTIVO: "Efectivo",
};

export default async function VentasPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const facturas = await obtenerFacturas();
  const pendientesMH = facturas.filter((f) => f.estadoMH === "PENDIENTE" || f.estadoMH === "ERROR").length;

  const totalMes = facturas.reduce(
    (acc, f) => acc.plus(new Decimal(f.total ?? "0")),
    new Decimal(0)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comprobantes</h1>
          <p className="text-sm text-gray-500 mt-1">{facturas.length} comprobante{facturas.length !== 1 ? "s" : ""} este mes</p>
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
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{pendientesMH} comprobante{pendientesMH !== 1 ? "s" : ""} pendiente{pendientesMH !== 1 ? "s" : ""} de envío a Hacienda.</span>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {facturas.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <FileText className="h-10 w-10 text-gray-300 mx-auto" />
            <p className="text-gray-500">No hay comprobantes este mes.</p>
            <Link href="/ventas/nueva" className="inline-block text-sm text-orange-600 font-medium">
              Emitir la primera factura →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Fecha</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Cliente</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Pago</th>
                  <th className="px-4 py-3 font-medium text-gray-600text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Estado MH</th>
                  <th className="px-4 py-3 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {facturas.map((f) => {
                  const mh = ESTADO_MH[f.estadoMH ?? "NO_APLICA"] ?? ESTADO_MH.NO_APLICA;
                  return (
                    <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {f.fecha.toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-gray-700">
                          {TIPO_COMPROBANTE[f.tipoComprobante] ?? f.tipoComprobante}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        {(f as { clienteNombre?: string }).clienteNombre ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {TIPO_PAGO[f.tipoPago ?? ""] ?? f.tipoPago ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        ₡{new Decimal(f.total ?? "0").toDecimalPlaces(0).toNumber().toLocaleString("es-CR")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${mh.color}`}>
                          {mh.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/ventas/${f.id}`} className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                          Ver
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
