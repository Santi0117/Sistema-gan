import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, RefreshCw } from "lucide-react";

type TipoMovimiento = "ENTRADA" | "SALIDA" | "AJUSTE" | "VENTA";

interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  producto: string;
  codigo: string;
  cantidad: number;
  unidad: string;
  referencia: string;
  notas: string;
  usuario: string;
  fecha: Date;
}

const MOCK_MOVIMIENTOS: Movimiento[] = [
  {
    id: "mv1", tipo: "ENTRADA", producto: "Leche entera 1L", codigo: "LECH001",
    cantidad: 100, unidad: "Unid", referencia: "OC-2026-001",
    notas: "Ingreso proveedor lechero", usuario: "admin@sistemagan.cr", fecha: new Date("2026-06-20"),
  },
  {
    id: "mv2", tipo: "VENTA", producto: "Queso turrialba 500g", codigo: "QUES001",
    cantidad: -3, unidad: "Unid", referencia: "F-0001",
    notas: "Venta ruta Centro", usuario: "vendedor@sistemagan.cr", fecha: new Date("2026-06-21"),
  },
  {
    id: "mv3", tipo: "AJUSTE", producto: "Vitaminas bovinas 500mL", codigo: "VITA001",
    cantidad: -1, unidad: "Unid", referencia: "AJ-001",
    notas: "Ajuste por vencimiento", usuario: "admin@sistemagan.cr", fecha: new Date("2026-06-22"),
  },
  {
    id: "mv4", tipo: "SALIDA", producto: "Balanceado bovino 50Kg", codigo: "BALA001",
    cantidad: -5, unidad: "Unid", referencia: "S-001",
    notas: "Uso interno finca", usuario: "admin@sistemagan.cr", fecha: new Date("2026-06-22"),
  },
  {
    id: "mv5", tipo: "ENTRADA", producto: "Crema de leche 500mL", codigo: "CREM001",
    cantidad: 20, unidad: "Unid", referencia: "OC-2026-002",
    notas: "Reposición stock", usuario: "admin@sistemagan.cr", fecha: new Date("2026-06-23"),
  },
];

const TIPO_CONFIG: Record<TipoMovimiento, { label: string; color: string; icon: React.ReactNode }> = {
  ENTRADA: {
    label: "Entrada",
    color: "bg-green-100 text-green-700",
    icon: <ArrowDownToLine className="h-3.5 w-3.5" />,
  },
  SALIDA: {
    label: "Salida",
    color: "bg-orange-100 text-orange-700",
    icon: <ArrowUpFromLine className="h-3.5 w-3.5" />,
  },
  AJUSTE: {
    label: "Ajuste",
    color: "bg-blue-100 text-blue-700",
    icon: <RefreshCw className="h-3.5 w-3.5" />,
  },
  VENTA: {
    label: "Venta",
    color: "bg-purple-100 text-purple-700",
    icon: <ArrowUpFromLine className="h-3.5 w-3.5" />,
  },
};

export default async function MovimientosPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const movimientos = MOCK_MOVIMIENTOS;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/inventario"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimientos de inventario</h1>
          <p className="text-sm text-gray-500 mt-1">Historial de entradas, salidas y ajustes</p>
        </div>
      </div>

      {/* Filtros rápidos (placeholder) */}
      <div className="flex flex-wrap gap-2">
        {(["TODOS", "ENTRADA", "SALIDA", "AJUSTE", "VENTA"] as const).map((tipo) => (
          <button
            key={tipo}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              tipo === "TODOS"
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
            }`}
          >
            {tipo === "TODOS" ? "Todos" : TIPO_CONFIG[tipo].label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Fecha</th>
                <th className="px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="px-4 py-3 font-medium text-gray-600">Producto</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Cantidad</th>
                <th className="px-4 py-3 font-medium text-gray-600">Referencia</th>
                <th className="px-4 py-3 font-medium text-gray-600">Notas</th>
                <th className="px-4 py-3 font-medium text-gray-600">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movimientos
                .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
                .map((mv) => {
                  const cfg = TIPO_CONFIG[mv.tipo];
                  const esNegativo = mv.cantidad < 0;
                  return (
                    <tr key={mv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {mv.fecha.toLocaleDateString("es-CR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{mv.producto}</p>
                        <p className="text-xs text-gray-400 font-mono">{mv.codigo}</p>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-bold ${
                          esNegativo ? "text-red-600" : "text-green-700"
                        }`}
                      >
                        {esNegativo ? "" : "+"}
                        {mv.cantidad} {mv.unidad}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{mv.referencia}</td>
                      <td className="px-4 py-3 text-gray-600">{mv.notas}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{mv.usuario}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-gray-400 text-center">
        Datos de demostración. Los movimientos reales se registran automáticamente al emitir facturas.
      </div>
    </div>
  );
}
