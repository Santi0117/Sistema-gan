import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";

const REPORTES = [
  { tipo: "ventas-mensual", titulo: "Ventas Mensuales", desc: "Totales agrupados por mes: subtotal, IVA y total.", icon: "📊", categoria: "Ventas" },
  { tipo: "ventas-detallado", titulo: "Ventas Detalladas", desc: "Cada comprobante con cliente, tipo de pago y estado MH.", icon: "📋", categoria: "Ventas" },
  { tipo: "compras-mensual", titulo: "Compras Mensuales", desc: "Totales de compras agrupados por mes.", icon: "🛒", categoria: "Compras" },
  { tipo: "clientes", titulo: "Clientes", desc: "Listado completo con ruta, crédito y estado.", icon: "👥", categoria: "Clientes" },
  { tipo: "creditos", titulo: "Créditos Vigentes", desc: "Clientes con crédito: saldo pendiente y días vencidos.", icon: "💳", categoria: "Clientes" },
  { tipo: "inventario-vendido", titulo: "Inventario Vendido", desc: "Resumen de unidades vendidas y monto por producto.", icon: "📦", categoria: "Inventario" },
  { tipo: "inventario-detallado", titulo: "Inventario Vendido Detallado", desc: "Cada línea de venta con producto, cantidad y precio.", icon: "🔍", categoria: "Inventario" },
  { tipo: "precios-inventario", titulo: "Precios de Inventario", desc: "Catálogo de productos con precio costo, venta y stock.", icon: "🏷️", categoria: "Inventario" },
  { tipo: "impuestos-ventas", titulo: "Ventas por Impuestos", desc: "Agrupado por tarifa IVA — alineado al Formulario D-150 TRIBU-CR.", icon: "📑", categoria: "Impuestos" },
  { tipo: "impuestos-compras", titulo: "Compras por Impuestos", desc: "IVA acreditable agrupado por tarifa — Formulario D-150.", icon: "🧾", categoria: "Impuestos" },
];

const CATEGORIA_COLOR: Record<string, string> = {
  Ventas: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Compras: "bg-blue-50 text-blue-700 border-blue-200",
  Clientes: "bg-purple-50 text-purple-700 border-purple-200",
  Inventario: "bg-green-50 text-green-700 border-green-200",
  Impuestos: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

export default async function ReportesPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const categorias = [...new Set(REPORTES.map((r) => r.categoria))];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-sm text-gray-500 mt-1">10 reportes con filtros por fecha, ruta y vendedor. Exportar Excel o imprimir.</p>
      </div>

      {categorias.map((cat) => (
        <div key={cat} className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{cat}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {REPORTES.filter((r) => r.categoria === cat).map((r) => (
              <Link
                key={r.tipo}
                href={`/reportes/${r.tipo}`}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-emerald-200 transition-all group flex gap-3"
              >
                <span className="text-2xl shrink-0">{r.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors truncate">{r.titulo}</h3>
                    <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded border font-medium ${CATEGORIA_COLOR[r.categoria]}`}>
                      {r.categoria}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
