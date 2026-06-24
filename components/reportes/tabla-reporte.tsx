"use client";

import { useState, useTransition } from "react";
import { exportarReporteExcel } from "@/app/(dashboard)/reportes/actions";
import type { ReporteData, ReporteRow, FiltrosReporte } from "@/app/(dashboard)/reportes/actions";

interface Props {
  reporte: ReporteData;
  tipo: string;
  filtros: FiltrosReporte;
}

const ESTADO_MH_COLOR: Record<string, string> = {
  ACEPTADA: "text-green-700 bg-green-50",
  PENDIENTE: "text-orange-700 bg-orange-50",
  RECHAZADA: "text-red-700 bg-red-50",
  ERROR: "text-red-700 bg-red-50",
  NO_APLICA: "text-gray-500 bg-gray-50",
};

const CREDITO_COLOR: Record<string, string> = {
  VENCIDO: "text-red-700 font-semibold",
  VIGENTE: "text-orange-700",
  "AL DÍA": "text-green-700",
};

export function TablaReporte({ reporte, tipo, filtros }: Props) {
  const [exporting, startExport] = useTransition();

  function formatCell(col: ReporteData["columnas"][0], val: string | number | null): string {
    if (val === null || val === "") return "—";
    if (col.format === "currency") {
      const n = typeof val === "string" ? parseFloat(val) : val;
      if (isNaN(n as number)) return String(val);
      return `₡${(n as number).toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (col.format === "number") {
      const n = typeof val === "string" ? parseFloat(val) : val;
      return (n as number).toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
    }
    if (col.format === "integer") return Number(val).toLocaleString("es-CR");
    return String(val);
  }

  function cellClass(col: ReporteData["columnas"][0], val: string | number | null, isTotals = false): string {
    const base = `px-3 py-2 text-sm whitespace-nowrap ${isTotals ? "font-semibold bg-gray-50" : ""}`;
    const align = col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left";

    // Special coloring for estado columns
    if (col.key === "estadoMH" && typeof val === "string") {
      const c = ESTADO_MH_COLOR[val] ?? "";
      if (c) return `${base} ${align}`;
    }
    if (col.key === "estado" && typeof val === "string" && CREDITO_COLOR[val]) {
      return `${base} ${align} ${CREDITO_COLOR[val]}`;
    }
    if (col.key === "alerta" && val) return `${base} ${align} text-orange-600 text-xs`;

    return `${base} ${align}`;
  }

  function badgeFor(col: ReporteData["columnas"][0], val: string | number | null) {
    if (col.key === "estadoMH" && typeof val === "string" && ESTADO_MH_COLOR[val]) {
      return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ESTADO_MH_COLOR[val]}`}>{val}</span>;
    }
    if (col.key === "estado" && typeof val === "string" && CREDITO_COLOR[val]) {
      return <span className={`text-xs font-semibold ${CREDITO_COLOR[val]}`}>{val}</span>;
    }
    if (col.key === "activo") return <span className={`text-xs ${val === "Sí" ? "text-green-700" : "text-gray-400"}`}>{val}</span>;
    return null;
  }

  function handleExcel() {
    startExport(async () => {
      const r = await exportarReporteExcel(tipo, filtros);
      if (r.base64) {
        const bin = atob(r.base64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        const blob = new Blob([arr], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${tipo}-${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between print:hidden">
        <p className="text-xs text-gray-400">{reporte.filas.length} fila{reporte.filas.length !== 1 ? "s" : ""}</p>
        <div className="flex gap-2">
          <button
            onClick={handleExcel}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-green-700 border border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-50"
          >
            <ExcelIcon /> {exporting ? "Exportando…" : "Exportar Excel"}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <PrintIcon /> Imprimir
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {reporte.filas.length === 0 ? (
          <div className="py-12 text-center space-y-1">
            <p className="text-gray-400 text-sm">Sin datos para el período seleccionado.</p>
            {reporte.notas && <p className="text-xs text-gray-300">{reporte.notas}</p>}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {reporte.columnas.map((c) => (
                      <th key={c.key} className={`px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"}`}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reporte.filas.map((fila, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      {reporte.columnas.map((col) => {
                        const val = fila[col.key] ?? null;
                        const badge = badgeFor(col, val);
                        return (
                          <td key={col.key} className={cellClass(col, val)}>
                            {badge ?? formatCell(col, val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                {reporte.totales && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200">
                      {reporte.columnas.map((col) => {
                        const val = reporte.totales![col.key] ?? null;
                        return (
                          <td key={col.key} className={cellClass(col, val, true)}>
                            {formatCell(col, val)}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            {reporte.notas && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500">* {reporte.notas}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ExcelIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}
function PrintIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>;
}
