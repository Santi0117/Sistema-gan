"use client";

import { useState, useCallback, useRef } from "react";
import { Search, Loader2, X } from "lucide-react";
import type { CabysResult } from "@/infrastructure/hacienda/hacienda-api";

interface CabysBuscadorProps {
  value: string;
  descripcionInicial?: string;
  onChange: (codigo: string, descripcion: string) => void;
  error?: string;
}

export function CabysBuscador({
  value,
  descripcionInicial = "",
  onChange,
  error,
}: CabysBuscadorProps) {
  const [query, setQuery] = useState(descripcionInicial);
  const [resultados, setResultados] = useState<CabysResult[]>([]);
  const [cargando, setCargando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const buscar = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 3) {
      setResultados([]);
      setAbierto(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setCargando(true);
      try {
        const res = await fetch(`/api/cabys?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        setResultados(json.cabys ?? []);
        setAbierto(true);
      } catch {
        setResultados([]);
      } finally {
        setCargando(false);
      }
    }, 400);
  }, []);

  const seleccionar = (item: CabysResult) => {
    setQuery(item.descripcion);
    setAbierto(false);
    setResultados([]);
    onChange(item.codigo, item.descripcion);
  };

  const limpiar = () => {
    setQuery("");
    setAbierto(false);
    setResultados([]);
    onChange("", "");
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            className={`w-full pl-9 pr-9 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              error ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Buscar en catálogo CABYS (mín. 3 caracteres)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              buscar(e.target.value);
            }}
            onBlur={() => setTimeout(() => setAbierto(false), 200)}
            onFocus={() => resultados.length > 0 && setAbierto(true)}
          />
          {cargando && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-orange-500" />
          )}
          {!cargando && (query || value) && (
            <button
              type="button"
              onClick={limpiar}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {abierto && resultados.length > 0 && (
          <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {resultados.map((item) => (
              <li key={item.codigo}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-orange-50 text-sm"
                  onMouseDown={() => seleccionar(item)}
                >
                  <span className="font-mono text-xs text-gray-500 mr-2">{item.codigo}</span>
                  <span className="text-gray-800">{item.descripcion}</span>
                  {item.impuesto > 0 && (
                    <span className="ml-2 text-xs text-orange-600">IVA {item.impuesto}%</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {abierto && resultados.length === 0 && !cargando && query.length >= 3 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2 text-sm text-gray-500">
            Sin resultados para "{query}"
          </div>
        )}
      </div>

      {value && (
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 border border-orange-100 rounded px-2 py-1">
          <span className="font-mono text-orange-700">{value}</span>
          <span className="text-gray-400">—</span>
          <span>{query || descripcionInicial}</span>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input type="hidden" name="codigoCabys" value={value} />
    </div>
  );
}
