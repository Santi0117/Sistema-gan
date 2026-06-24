import { getSession } from "@/lib/session";
import {
  FileText,
  AlertTriangle,
  TrendingUp,
  Package,
} from "lucide-react";

// Placeholders — se reemplazarán con datos reales en FASE 10
const STATS = [
  { label: "Facturas del mes", value: "—", icon: FileText, badge: null },
  { label: "Ventas del mes", value: "—", icon: TrendingUp, badge: null },
  { label: "Pendientes MH", value: "—", icon: AlertTriangle, badge: "warn" },
  { label: "Stock bajo", value: "—", icon: Package, badge: "err" },
];

export default async function ControlPage() {
  const session = await getSession();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Saludo */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Buen día, {session.nombre.split(" ")[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString("es-CR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATS.map(({ label, value, icon: Icon, badge }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">{label}</p>
              <Icon size={15} className="text-gray-400" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {badge === "warn" && (
              <span className="mt-2 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                Conectá la DB
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Aviso dev */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">Modo desarrollo</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Las métricas aparecerán cuando la base de datos esté conectada (Docker:{" "}
            <code className="font-mono">docker compose up -d postgres redis</code>).
          </p>
        </div>
      </div>
    </div>
  );
}
