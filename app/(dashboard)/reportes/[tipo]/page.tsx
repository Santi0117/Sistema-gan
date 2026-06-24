import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { obtenerReporte, type FiltrosReporte } from "../actions";
import { TablaReporte } from "@/components/reportes/tabla-reporte";
import { FiltrosReporte as FiltrosBar } from "@/components/reportes/filtros-reporte";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";

const TITULOS: Record<string, string> = {
  "ventas-mensual": "Ventas Mensuales",
  "ventas-detallado": "Ventas Detalladas",
  "compras-mensual": "Compras Mensuales",
  "clientes": "Clientes",
  "creditos": "Créditos Vigentes",
  "inventario-vendido": "Inventario Vendido",
  "inventario-detallado": "Inventario Vendido Detallado",
  "precios-inventario": "Precios de Inventario",
  "impuestos-ventas": "Ventas por Impuestos",
  "impuestos-compras": "Compras por Impuestos",
};

// Rutas y usuarios mock para los filtros
const RUTAS_MOCK = [
  { id: "r1", nombre: "Ruta Norte" },
  { id: "r2", nombre: "Ruta Sur" },
  { id: "r3", nombre: "Ruta Centro" },
];

const USUARIOS_MOCK = [
  { id: "u1", nombre: "Juan Vendedor" },
  { id: "u2", nombre: "Ana García" },
];

// Reportes que NO usan filtros de ruta/vendedor
const SIN_RUTA = new Set(["precios-inventario", "compras-mensual", "impuestos-compras"]);
const SIN_VENDEDOR = new Set(["clientes", "creditos", "precios-inventario"]);

interface Props {
  params: Promise<{ tipo: string }>;
  searchParams: Promise<FiltrosReporte>;
}

export default async function ReportePage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const [{ tipo }, filtros] = await Promise.all([params, searchParams]);

  if (!TITULOS[tipo]) notFound();

  const reporte = await obtenerReporte(tipo, filtros);
  if (!reporte) notFound();

  const titulo = TITULOS[tipo];

  return (
    <div className="p-6 space-y-5 print:p-4">
      {/* Header */}
      <div className="flex items-start gap-3 print:hidden">
        <Link href="/reportes" className="mt-1 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
          {reporte.descripcion && (
            <p className="text-sm text-gray-500 mt-0.5">{reporte.descripcion}</p>
          )}
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold text-gray-900">{titulo}</h1>
        {reporte.descripcion && <p className="text-sm text-gray-500">{reporte.descripcion}</p>}
        <p className="text-xs text-gray-400 mt-1">
          {filtros.desde && `Desde: ${filtros.desde}`}
          {filtros.desde && filtros.hasta && " — "}
          {filtros.hasta && `Hasta: ${filtros.hasta}`}
          {!filtros.desde && !filtros.hasta && "Todos los períodos"}
        </p>
      </div>

      {/* Filtros */}
      <Suspense fallback={null}>
        <FiltrosBar
          rutas={RUTAS_MOCK}
          usuarios={USUARIOS_MOCK}
          mostrarRuta={!SIN_RUTA.has(tipo)}
          mostrarVendedor={!SIN_VENDEDOR.has(tipo)}
        />
      </Suspense>

      {/* Tabla */}
      <TablaReporte reporte={reporte} tipo={tipo} filtros={filtros} />
    </div>
  );
}
