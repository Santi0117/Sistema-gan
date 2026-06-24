"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Props {
  rutas?: { id: string; nombre: string }[];
  usuarios?: { id: string; nombre: string }[];
  mostrarRuta?: boolean;
  mostrarVendedor?: boolean;
}

export function FiltrosReporte({ rutas = [], usuarios = [], mostrarRuta = true, mostrarVendedor = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const set = useCallback(
    (key: string, value: string) => {
      const p = new URLSearchParams(searchParams.toString());
      if (value) p.set(key, value); else p.delete(key);
      router.replace(`${pathname}?${p.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const g = (k: string) => searchParams.get(k) ?? "";
  const hayFiltros = ["desde", "hasta", "rutaId", "vendedorId"].some((k) => searchParams.has(k));

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap gap-3 items-end print:hidden">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Desde</label>
        <input type="date" value={g("desde")} onChange={(e) => set("desde", e.target.value)}
          className="h-9 px-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Hasta</label>
        <input type="date" value={g("hasta")} onChange={(e) => set("hasta", e.target.value)}
          className="h-9 px-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400" />
      </div>

      {mostrarRuta && rutas.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Ruta</label>
          <select value={g("rutaId")} onChange={(e) => set("rutaId", e.target.value)}
            className="h-9 px-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white" style={{ minWidth: 140 }}>
            <option value="">Todas las rutas</option>
            {rutas.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
        </div>
      )}

      {mostrarVendedor && usuarios.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Vendedor</label>
          <select value={g("vendedorId")} onChange={(e) => set("vendedorId", e.target.value)}
            className="h-9 px-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white" style={{ minWidth: 140 }}>
            <option value="">Todos</option>
            {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
        </div>
      )}

      {hayFiltros && (
        <button onClick={() => router.replace(pathname)}
          className="h-9 px-3 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 mt-auto">
          Limpiar
        </button>
      )}
    </div>
  );
}
