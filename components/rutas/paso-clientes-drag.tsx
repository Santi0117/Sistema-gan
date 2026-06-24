"use client";

import { useState, useRef } from "react";

export interface ClienteOpcion {
  id: string;
  nombre: string;
  nombreNegocio?: string | null;
  codigoNegocio?: string | null;
  telefono?: string | null;
  rutaId: string | null;
  ordenEnRuta: number | null;
}

export interface ClienteAsignado {
  id: string;
  nombre: string;
  codigoNegocio?: string | null;
  orden: number;
}

interface Props {
  todosClientes: ClienteOpcion[];
  rutaId?: string;
  asignados: ClienteAsignado[];
  onChange: (asignados: ClienteAsignado[]) => void;
}

export function PasoClientesDrag({ todosClientes, rutaId, asignados, onChange }: Props) {
  const [busqueda, setBusqueda] = useState("");

  // IDs already assigned to this route
  const asignadosIds = new Set(asignados.map((c) => c.id));

  // Clients not assigned to this route (and not in another route, or in this route)
  const disponibles = todosClientes.filter((c) => {
    if (asignadosIds.has(c.id)) return false;
    if (c.rutaId && c.rutaId !== rutaId) return false; // belongs to another route
    return true;
  });

  const filtrados = busqueda
    ? disponibles.filter((c) =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.nombreNegocio ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.codigoNegocio ?? "").toLowerCase().includes(busqueda.toLowerCase())
      )
    : disponibles;

  function agregar(c: ClienteOpcion) {
    onChange([...asignados, { id: c.id, nombre: c.nombre, codigoNegocio: c.codigoNegocio, orden: asignados.length + 1 }]);
  }

  function quitar(id: string) {
    const nuevos = asignados
      .filter((c) => c.id !== id)
      .map((c, i) => ({ ...c, orden: i + 1 }));
    onChange(nuevos);
  }

  // Drag-to-reorder within the assigned list
  const dragIdx = useRef<number | null>(null);

  function handleDragStart(i: number) {
    dragIdx.current = i;
  }

  function handleDrop(i: number) {
    if (dragIdx.current === null || dragIdx.current === i) return;
    const arr = [...asignados];
    const [moved] = arr.splice(dragIdx.current, 1);
    arr.splice(i, 0, moved);
    onChange(arr.map((c, idx) => ({ ...c, orden: idx + 1 })));
    dragIdx.current = null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Columna izquierda: disponibles */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Clientes disponibles</h3>
          <span className="text-xs text-gray-400">{filtrados.length}</span>
        </div>
        <input
          type="search"
          placeholder="Buscar cliente…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-400"
        />
        <div className="border border-gray-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto divide-y divide-gray-50">
          {filtrados.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400">
              {busqueda ? "Sin resultados" : "Todos los clientes ya están asignados"}
            </p>
          )}
          {filtrados.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{c.nombre}</p>
                {c.codigoNegocio && (
                  <p className="text-xs text-gray-400">{c.codigoNegocio}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => agregar(c)}
                className="shrink-0 text-xs px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                + Agregar
              </button>
            </div>
          ))}
        </div>
        {filtrados.length > 0 && (
          <button
            type="button"
            onClick={() => filtrados.forEach((c) => agregar(c))}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Agregar todos →
          </button>
        )}
      </div>

      {/* Columna derecha: asignados (drag to reorder) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">En esta ruta</h3>
          <span className="text-xs text-gray-400">{asignados.length} cliente{asignados.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[315px] overflow-y-auto divide-y divide-gray-50">
          {asignados.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400">Agregá clientes desde la lista</p>
          )}
          {asignados.map((c, i) => (
            <div
              key={c.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 cursor-grab active:cursor-grabbing select-none group"
            >
              {/* Drag handle */}
              <span className="text-gray-300 text-xs font-mono w-4 shrink-0">
                <DragIcon />
              </span>
              <span className="text-xs text-gray-400 w-5 shrink-0 text-right">{c.orden}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{c.nombre}</p>
                {c.codigoNegocio && (
                  <p className="text-xs text-gray-400">{c.codigoNegocio}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => quitar(c.id)}
                className="shrink-0 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <XIcon />
              </button>
            </div>
          ))}
        </div>
        {asignados.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-gray-400 hover:text-red-500"
          >
            Quitar todos
          </button>
        )}
      </div>
    </div>
  );
}

function DragIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM9 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM9 17a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
