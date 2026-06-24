import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { obtenerProductos } from "@/app/(dashboard)/productos/actions";
import Link from "next/link";
import { Package, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { Decimal } from "decimal.js";

function valorStock(precio: string, stock: string): Decimal {
  return new Decimal(precio).mul(new Decimal(stock));
}

function formatCRC(n: Decimal): string {
  return `₡${n.toDecimalPlaces(2).toNumber().toLocaleString("es-CR", { minimumFractionDigits: 2 })}`;
}

export default async function InventarioPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const productos = await obtenerProductos();

  const activos = productos.filter((p) => p.activo);
  const stockBajo = activos.filter(
    (p) =>
      p.controlarStock &&
      new Decimal(p.stockActual ?? "0").lt(new Decimal(p.stockMinimo ?? "0"))
  );

  const valorTotalCosto = activos
    .filter((p) => p.controlarStock)
    .reduce(
      (acc, p) => acc.plus(valorStock(p.precioCosto, p.stockActual ?? "0")),
      new Decimal(0)
    );

  const valorTotalVenta = activos
    .filter((p) => p.controlarStock)
    .reduce(
      (acc, p) => acc.plus(valorStock(p.precioVenta, p.stockActual ?? "0")),
      new Decimal(0)
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-500 mt-1">Vista general del stock actual</p>
        </div>
        <Link
          href="/inventario/movimientos"
          className="flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          Ver movimientos <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Productos activos</p>
          <p className="text-3xl font-bold text-gray-900">{activos.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Valor costo</p>
          <p className="text-2xl font-bold text-gray-900">{formatCRC(valorTotalCosto)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Valor venta</p>
          <p className="text-2xl font-bold text-green-700">{formatCRC(valorTotalVenta)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Alerta stock bajo</p>
          <p className="text-3xl font-bold text-red-600">{stockBajo.length}</p>
        </div>
      </div>

      {/* Alertas */}
      {stockBajo.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="font-semibold text-red-700">
              {stockBajo.length} producto{stockBajo.length !== 1 ? "s" : ""} con stock bajo
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {stockBajo.map((p) => (
              <Link
                key={p.id}
                href={`/productos/${p.id}`}
                className="flex items-center justify-between bg-white border border-red-200 rounded-lg px-3 py-2 text-sm hover:border-red-400 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-800">{p.nombre}</p>
                  <p className="text-xs text-gray-500">{p.codigo}</p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      new Decimal(p.stockActual ?? "0").lte(0)
                        ? "text-red-600"
                        : "text-orange-500"
                    }`}
                  >
                    {new Decimal(p.stockActual ?? "0").toNumber()}
                  </p>
                  <p className="text-xs text-gray-400">
                    mín. {new Decimal(p.stockMinimo ?? "0").toNumber()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de stock */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package className="h-5 w-5 text-orange-500" />
          <h2 className="font-semibold text-gray-800">Stock por producto</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Código</th>
                <th className="px-4 py-3 font-medium text-gray-600">Producto</th>
                <th className="px-4 py-3 font-medium text-gray-600">Categoría</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Stock</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Mínimo</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Precio venta</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Valor venta</th>
                <th className="px-4 py-3 font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activos
                .sort((a, b) => {
                  const aLow = new Decimal(a.stockActual ?? "0").lt(
                    new Decimal(a.stockMinimo ?? "0")
                  );
                  const bLow = new Decimal(b.stockActual ?? "0").lt(
                    new Decimal(b.stockMinimo ?? "0")
                  );
                  return aLow === bLow ? 0 : aLow ? -1 : 1;
                })
                .map((p) => {
                  const stock = new Decimal(p.stockActual ?? "0");
                  const minimo = new Decimal(p.stockMinimo ?? "0");
                  const bajo = p.controlarStock && stock.lt(minimo);
                  const sinStk = p.controlarStock && stock.lte(0);
                  const valVenta = valorStock(p.precioVenta, p.stockActual ?? "0");
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
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.categoria ?? "—"}</td>
                      <td
                        className={`px-4 py-3 text-right font-bold ${
                          sinStk
                            ? "text-red-600"
                            : bajo
                              ? "text-orange-500"
                              : "text-gray-800"
                        }`}
                      >
                        {stock.toNumber()} {p.unidadMedida}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">{minimo.toNumber()}</td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatCRC(new Decimal(p.precioVenta))}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatCRC(valVenta)}</td>
                      <td className="px-4 py-3">
                        {!p.controlarStock ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            Sin control
                          </span>
                        ) : sinStk ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            Sin stock
                          </span>
                        ) : bajo ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                            Stock bajo
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {activos.length === 0 && (
            <div className="text-center py-12 text-gray-500">No hay productos activos.</div>
          )}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <TrendingUp className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800">
          <strong>Modo desarrollo:</strong> los datos de stock son de demostración. Los movimientos
          reales se conectan automáticamente al registrar ventas (Fase 5).
        </div>
      </div>
    </div>
  );
}
