"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const TIPOS = [
  { value: "", label: "Todos los tipos" },
  { value: "FE", label: "Factura Electrónica" },
  { value: "TE", label: "Tiquete Electrónico" },
  { value: "ND", label: "Nota de Débito" },
  { value: "NC", label: "Nota de Crédito" },
  { value: "FEC", label: "Factura de Compra" },
  { value: "REP", label: "Recibo de Pago" },
  { value: "NORMAL", label: "Factura Local" },
];

const ESTADOS = [
  { value: "", label: "Todos los estados" },
  { value: "ACTIVA", label: "Activa" },
  { value: "ANULADA", label: "Anulada" },
  { value: "PAGADA", label: "Pagada" },
];

const ESTADOS_MH = [
  { value: "", label: "Todos MH" },
  { value: "NO_APLICA", label: "No aplica" },
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_PROCESO", label: "En proceso" },
  { value: "ACEPTADA", label: "Aceptada" },
  { value: "RECHAZADA", label: "Rechazada" },
  { value: "ERROR", label: "Error" },
];

const TIPO_PAGO = [
  { value: "", label: "Todos los pagos" },
  { value: "CONTADO", label: "Contado" },
  { value: "CREDITO", label: "Crédito" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "SINPE_MOVIL", label: "SINPE Móvil" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "PLATAFORMA_DIGITAL", label: "Digital" },
];

interface Props {
  onExportExcel?: () => void;
  exportando?: boolean;
}

export function FiltrosComprobantes({ onExportExcel, exportando }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const get = (key: string) => searchParams.get(key) ?? "";

  const hayFiltros = ["tipo", "estado", "estadoMH", "pago", "desde", "hasta"].some(
    (k) => searchParams.has(k)
  );

  function limpiar() {
    router.replace(pathname);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap gap-2 items-end">
        {/* Tipo comprobante */}
        <FilterSelect
          label="Tipo"
          value={get("tipo")}
          options={TIPOS}
          onChange={(v) => setParam("tipo", v)}
        />

        {/* Estado factura */}
        <FilterSelect
          label="Estado"
          value={get("estado")}
          options={ESTADOS}
          onChange={(v) => setParam("estado", v)}
        />

        {/* Estado MH */}
        <FilterSelect
          label="Estado MH"
          value={get("estadoMH")}
          options={ESTADOS_MH}
          onChange={(v) => setParam("estadoMH", v)}
        />

        {/* Tipo de pago */}
        <FilterSelect
          label="Pago"
          value={get("pago")}
          options={TIPO_PAGO}
          onChange={(v) => setParam("pago", v)}
        />

        {/* Rango de fecha */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Desde</label>
          <input
            type="date"
            value={get("desde")}
            onChange={(e) => setParam("desde", e.target.value)}
            className="h-9 px-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Hasta</label>
          <input
            type="date"
            value={get("hasta")}
            onChange={(e) => setParam("hasta", e.target.value)}
            className="h-9 px-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-400"
          />
        </div>

        {/* Limpiar */}
        {hayFiltros && (
          <button
            onClick={limpiar}
            className="h-9 px-3 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 mt-[18px]"
          >
            Limpiar
          </button>
        )}

        {/* Export Excel */}
        {onExportExcel && (
          <button
            onClick={onExportExcel}
            disabled={exportando}
            className="h-9 px-3 text-xs text-green-700 border border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-50 ml-auto mt-[18px] flex items-center gap-1.5"
          >
            <ExcelIcon />
            {exportando ? "Exportando…" : "Exportar Excel"}
          </button>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 px-2 pr-7 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-400 bg-white appearance-none"
        style={{ minWidth: "130px" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ExcelIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
