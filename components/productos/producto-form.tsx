"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CabysBuscador } from "./cabys-buscador";
import {
  TIPOS_IMPUESTO,
  TIPOS_IMPUESTO_LABEL,
  UNIDADES_MEDIDA,
} from "@/lib/zod-schemas";
import type { Producto } from "@/infrastructure/db/schema";

interface ProductoFormProps {
  producto?: Producto;
  action: (prev: { error: string }, formData: FormData) => Promise<{ error: string }>;
  titulo: string;
}

const initialState = { error: "" };

export function ProductoForm({ producto, action, titulo }: ProductoFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [cabysCode, setCabysCode] = useState(producto?.codigoCabys ?? "");
  const [cabysDesc, setCabysDesc] = useState("");
  const [controlarStock, setControlarStock] = useState(producto?.controlarStock ?? true);

  return (
    <form action={formAction} className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
        <Link
          href="/productos"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </Link>
      </div>

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Sección: Información básica */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
          Información básica
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Código <span className="text-red-500">*</span>
            </label>
            <input
              name="codigo"
              type="text"
              defaultValue={producto?.codigo}
              placeholder="Ej: LECH001"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Categoría
            </label>
            <input
              name="categoria"
              type="text"
              defaultValue={producto?.categoria ?? ""}
              placeholder="Ej: Lácteos"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Nombre del producto <span className="text-red-500">*</span>
          </label>
          <input
            name="nombre"
            type="text"
            defaultValue={producto?.nombre}
            placeholder="Ej: Leche entera 1L"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            name="descripcion"
            defaultValue={producto?.descripcion ?? ""}
            rows={2}
            placeholder="Descripción opcional del producto"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
        </div>
      </div>

      {/* Sección: CABYS */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
        <div>
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
            Código CABYS
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Requerido para facturas electrónicas. Busca por nombre de producto en el catálogo
            oficial de Hacienda.
          </p>
        </div>
        <CabysBuscador
          value={cabysCode}
          descripcionInicial={cabysDesc}
          onChange={(code, desc) => {
            setCabysCode(code);
            setCabysDesc(desc);
          }}
        />
      </div>

      {/* Sección: Precios e impuesto */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
          Precios e impuesto
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Precio costo (₡) <span className="text-red-500">*</span>
            </label>
            <input
              name="precioCosto"
              type="text"
              inputMode="decimal"
              defaultValue={producto?.precioCosto ?? "0"}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Precio venta (₡) <span className="text-red-500">*</span>
            </label>
            <input
              name="precioVenta"
              type="text"
              inputMode="decimal"
              defaultValue={producto?.precioVenta ?? "0"}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Unidad de medida <span className="text-red-500">*</span>
            </label>
            <select
              name="unidadMedida"
              defaultValue={producto?.unidadMedida ?? "Unid"}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              {UNIDADES_MEDIDA.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Tipo de IVA <span className="text-red-500">*</span>
          </label>
          <select
            name="tipoImpuesto"
            defaultValue={producto?.tipoImpuesto ?? "EXENTO"}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            {TIPOS_IMPUESTO.map((t) => (
              <option key={t} value={t}>
                {TIPOS_IMPUESTO_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sección: Inventario */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
          Control de inventario
        </h2>

        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              name="controlarStock"
              checked={controlarStock}
              onChange={(e) => setControlarStock(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-10 h-6 rounded-full transition-colors ${
                controlarStock ? "bg-emerald-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  controlarStock ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-gray-700">Controlar stock</span>
        </label>

        {controlarStock && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Stock actual</label>
              <input
                name="stockActual"
                type="text"
                inputMode="decimal"
                defaultValue={producto?.stockActual ?? "0"}
                placeholder="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Stock mínimo</label>
              <input
                name="stockMinimo"
                type="text"
                inputMode="decimal"
                defaultValue={producto?.stockMinimo ?? "0"}
                placeholder="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-400">Se mostrará alerta cuando el stock esté por debajo.</p>
            </div>
          </div>
        )}

        {!controlarStock && (
          <input type="hidden" name="stockActual" value="0" />
        )}
        {!controlarStock && (
          <input type="hidden" name="stockMinimo" value="0" />
        )}
      </div>

      {/* Activo */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-700">Producto activo</p>
            <p className="text-xs text-gray-400">Los productos inactivos no aparecen en el punto de venta.</p>
          </div>
          <input
            type="checkbox"
            name="activo"
            defaultChecked={producto?.activo ?? true}
            className="w-4 h-4 accent-orange-500"
          />
        </label>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3">
        <Link
          href="/productos"
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {pending ? "Guardando…" : "Guardar producto"}
        </button>
      </div>
    </form>
  );
}
