"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Decimal } from "decimal.js";
import {
  calcularLinea,
  calcularTotales,
  type LineaInput,
} from "@/domain/facturacion/calcular-totales";
import { TARIFAS_IVA, type TipoImpuesto, type TipoComprobante } from "@/domain/facturacion/tipos";
import { TIPOS_IMPUESTO_LABEL } from "@/lib/zod-schemas";
import { emitirFactura, type LineaFacturaInput } from "@/app/(dashboard)/ventas/actions";
import { obtenerProductos } from "@/app/(dashboard)/productos/actions";
import { obtenerClientes } from "@/app/(dashboard)/clientes/actions";
import type { Producto, Cliente } from "@/infrastructure/db/schema";
import {
  Plus, Trash2, Search, Loader2, AlertTriangle, Check, X, ShoppingCart,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineaState {
  tempId: string;
  productoId: string | null;
  codigoCabys: string;
  descripcion: string;
  unidadMedida: string;
  cantidad: string;
  precioUnitario: string;
  descuentoPct: string;
  tipoImpuesto: TipoImpuesto;
}

const TIPOS_COMPROBANTE: { value: TipoComprobante; label: string }[] = [
  { value: "FE", label: "01 - Factura Electrónica" },
  { value: "TE", label: "04 - Tiquete Electrónico" },
  { value: "NORMAL", label: "Factura Local (sin MH)" },
  { value: "ND", label: "02 - Nota de Débito" },
  { value: "NC", label: "03 - Nota de Crédito" },
  { value: "FEC", label: "08 - Factura de Compra" },
  { value: "REP", label: "10 - Recibo de Pago" },
];

const TIPOS_PAGO = [
  { value: "CONTADO", label: "Contado / Efectivo" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "SINPE_MOVIL", label: "SINPE Móvil" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "CREDITO", label: "Crédito" },
  { value: "PLATAFORMA_DIGITAL", label: "Plataforma digital" },
];

function newLinea(): LineaState {
  return {
    tempId: crypto.randomUUID(),
    productoId: null,
    codigoCabys: "",
    descripcion: "",
    unidadMedida: "Unid",
    cantidad: "1",
    precioUnitario: "0",
    descuentoPct: "0",
    tipoImpuesto: "EXENTO",
  };
}

function fmt(d: Decimal): string {
  return d.toDecimalPlaces(2).toNumber().toLocaleString("es-CR", { minimumFractionDigits: 2 });
}

// ─── Buscador de cliente ──────────────────────────────────────────────────────

function BuscadorCliente({
  clienteSeleccionado,
  onSelect,
}: {
  clienteSeleccionado: Cliente | null;
  onSelect: (c: Cliente | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buscar = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery(q);
    if (q.length < 2) { setResultados([]); return; }
    debounceRef.current = setTimeout(async () => {
      setCargando(true);
      try {
        const lista = await obtenerClientes(q);
        setResultados(lista.slice(0, 8));
      } catch { setResultados([]); }
      finally { setCargando(false); }
    }, 300);
  }, []);

  if (clienteSeleccionado) {
    return (
      <div className="flex items-start justify-between bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
        <div>
          <p className="font-semibold text-gray-800">{clienteSeleccionado.nombre}</p>
          {clienteSeleccionado.nombreNegocio && (
            <p className="text-xs text-gray-500">{clienteSeleccionado.nombreNegocio}</p>
          )}
          {clienteSeleccionado.identificacion && (
            <p className="text-xs font-mono text-gray-500">{clienteSeleccionado.identificacion}</p>
          )}
          {clienteSeleccionado.tieneCredito && (
            <span className="text-xs text-blue-600">Crédito: {clienteSeleccionado.diasCredito} días</span>
          )}
        </div>
        <button onClick={() => onSelect(null)} className="text-gray-400 hover:text-red-500 ml-3">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Buscar cliente por nombre o cédula…"
          value={query}
          onChange={(e) => buscar(e.target.value)}
          onBlur={() => setTimeout(() => setResultados([]), 200)}
        />
        {cargando && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-orange-500" />}
      </div>
      {resultados.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {resultados.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-orange-50 text-sm"
                onMouseDown={() => { onSelect(c); setResultados([]); setQuery(""); }}
              >
                <span className="font-medium text-gray-800">{c.nombre}</span>
                {c.identificacion && <span className="ml-2 text-xs font-mono text-gray-400">{c.identificacion}</span>}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs text-gray-500 border-t"
              onMouseDown={() => {
                onSelect({ id: "generico", nombre: "Consumidor Final", tipoIdentificacion: "GENERICO" } as Cliente);
                setResultados([]); setQuery("");
              }}
            >
              Usar consumidor final →
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

// ─── Fila de línea ────────────────────────────────────────────────────────────

function LineaRow({
  linea,
  index,
  onChange,
  onDelete,
}: {
  linea: LineaState;
  index: number;
  onChange: (id: string, patch: Partial<LineaState>) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState(linea.descripcion);
  const [resultados, setResultados] = useState<Producto[]>([]);
  const [open, setOpen] = useState(false);
  const [cargando, setCargando] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buscarProducto = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResultados([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setCargando(true);
      try {
        const lista = await obtenerProductos(q);
        setResultados(lista.filter((p) => p.activo).slice(0, 8));
        setOpen(true);
      } catch { setResultados([]); }
      finally { setCargando(false); }
    }, 300);
  }, []);

  const seleccionarProducto = (p: Producto) => {
    onChange(linea.tempId, {
      productoId: p.id,
      codigoCabys: p.codigoCabys ?? "",
      descripcion: p.nombre,
      unidadMedida: p.unidadMedida,
      precioUnitario: new Decimal(p.precioVenta).toFixed(5),
      tipoImpuesto: p.tipoImpuesto as TipoImpuesto,
    });
    setQuery(p.nombre);
    setResultados([]);
    setOpen(false);
  };

  // Calc linea live
  let lineaCalc = null;
  try {
    if (linea.cantidad && linea.precioUnitario && parseFloat(linea.cantidad) > 0) {
      lineaCalc = calcularLinea({
        cantidad: linea.cantidad,
        precioUnitario: linea.precioUnitario,
        descuentoPct: linea.descuentoPct || "0",
        tipoImpuesto: linea.tipoImpuesto,
      });
    }
  } catch { /* invalid input, skip */ }

  const stockBajo = false; // TODO connect when DB is live

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-2 py-2 text-xs text-gray-400 text-center w-8">{index + 1}</td>

      {/* Producto search */}
      <td className="px-2 py-2 min-w-[200px]">
        <div className="relative">
          <input
            type="text"
            className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
            placeholder="Buscar producto…"
            value={query}
            onChange={(e) => buscarProducto(e.target.value)}
            onFocus={() => resultados.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
          />
          {cargando && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-orange-400" />}
          {open && resultados.length > 0 && (
            <ul className="absolute z-50 left-0 top-full mt-0.5 w-72 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {resultados.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-1.5 hover:bg-orange-50 text-xs"
                    onMouseDown={() => seleccionarProducto(p)}
                  >
                    <span className="font-medium text-gray-800">{p.nombre}</span>
                    <span className="ml-2 text-gray-400">₡{new Decimal(p.precioVenta).toDecimalPlaces(0).toNumber().toLocaleString("es-CR")}</span>
                    {p.controlarStock && (
                      <span className={`ml-1 ${new Decimal(p.stockActual ?? "0").lte(0) ? "text-red-400" : "text-gray-400"}`}>
                        · {new Decimal(p.stockActual ?? "0").toNumber()} {p.unidadMedida}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {linea.codigoCabys && (
          <p className="text-xs font-mono text-gray-400 mt-0.5">{linea.codigoCabys}</p>
        )}
        {!linea.codigoCabys && linea.descripcion && (
          <p className="text-xs text-amber-500 mt-0.5 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Sin CABYS
          </p>
        )}
      </td>

      {/* Cantidad */}
      <td className="px-2 py-2 w-20">
        <input
          type="text"
          inputMode="decimal"
          className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-orange-400"
          value={linea.cantidad}
          onChange={(e) => onChange(linea.tempId, { cantidad: e.target.value })}
        />
      </td>

      {/* Precio */}
      <td className="px-2 py-2 w-28">
        <input
          type="text"
          inputMode="decimal"
          className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-orange-400"
          value={linea.precioUnitario}
          onChange={(e) => onChange(linea.tempId, { precioUnitario: e.target.value })}
        />
      </td>

      {/* Descuento */}
      <td className="px-2 py-2 w-16">
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-orange-400 pr-5"
            value={linea.descuentoPct}
            onChange={(e) => onChange(linea.tempId, { descuentoPct: e.target.value })}
          />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
        </div>
      </td>

      {/* IVA */}
      <td className="px-2 py-2 w-28">
        <select
          className="w-full border border-gray-200 rounded-md px-1 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-400"
          value={linea.tipoImpuesto}
          onChange={(e) => onChange(linea.tempId, { tipoImpuesto: e.target.value as TipoImpuesto })}
        >
          {(Object.keys(TARIFAS_IVA) as TipoImpuesto[]).map((t) => (
            <option key={t} value={t}>
              {TIPOS_IMPUESTO_LABEL[t]}
            </option>
          ))}
        </select>
      </td>

      {/* Total línea */}
      <td className="px-2 py-2 w-28 text-right text-sm font-medium text-gray-700">
        {lineaCalc ? `₡${fmt(lineaCalc.totalLinea)}` : "—"}
      </td>

      {/* Eliminar */}
      <td className="px-2 py-2 w-8">
        <button
          type="button"
          onClick={() => onDelete(linea.tempId)}
          className="text-gray-300 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

// ─── Panel de totales ─────────────────────────────────────────────────────────

function PanelTotales({ lineas }: { lineas: LineaState[] }) {
  const lineasValidas: LineaInput[] = lineas.filter(
    (l) => l.descripcion && parseFloat(l.cantidad) > 0 && parseFloat(l.precioUnitario) >= 0
  ).map((l) => ({
    cantidad: l.cantidad,
    precioUnitario: l.precioUnitario,
    descuentoPct: l.descuentoPct || "0",
    tipoImpuesto: l.tipoImpuesto,
  }));

  if (lineasValidas.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center text-sm text-gray-400">
        Agrega líneas para ver los totales
      </div>
    );
  }

  let totales;
  try {
    totales = calcularTotales(lineasValidas);
  } catch {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
        Error calculando totales — verifica los valores ingresados.
      </div>
    );
  }

  const ivaEntries = Object.entries(totales.impuestoPorTarifa).filter(
    ([, v]) => v.gt(0)
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">Resumen</h3>
      </div>
      <div className="px-5 py-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-500">
          <span>Subtotal</span>
          <span>₡{fmt(totales.subtotal)}</span>
        </div>
        {totales.descuento.gt(0) && (
          <div className="flex justify-between text-orange-600">
            <span>Descuento</span>
            <span>-₡{fmt(totales.descuento)}</span>
          </div>
        )}
        {ivaEntries.length > 0 && (
          <div className="border-t border-gray-100 pt-2 space-y-1">
            {ivaEntries.map(([tarifa, monto]) => (
              <div key={tarifa} className="flex justify-between text-gray-500">
                <span>IVA {tarifa}%</span>
                <span>₡{fmt(monto)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-lg text-gray-900">
          <span>Total</span>
          <span>₡{fmt(totales.total)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function NuevaFactura() {
  const router = useRouter();
  const hoy = new Date().toISOString().split("T")[0];

  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>("FE");
  const [tipoPago, setTipoPago] = useState("CONTADO");
  const [moneda, setMoneda] = useState<"CRC" | "USD">("CRC");
  const [fecha, setFecha] = useState(hoy);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [lineas, setLineas] = useState<LineaState[]>([newLinea()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<{ facturaId: string; claveNumerica?: string; numero?: string } | null>(null);

  const updateLinea = useCallback((id: string, patch: Partial<LineaState>) => {
    setLineas((prev) => prev.map((l) => l.tempId === id ? { ...l, ...patch } : l));
  }, []);

  const deleteLinea = useCallback((id: string) => {
    setLineas((prev) => prev.filter((l) => l.tempId !== id));
  }, []);

  const addLinea = () => setLineas((prev) => [...prev, newLinea()]);

  const sinCabys = lineas.some((l) => l.descripcion && !l.codigoCabys);

  const handleEmitir = async () => {
    setError("");
    const lineasValidas: LineaFacturaInput[] = lineas.filter(
      (l) => l.descripcion && parseFloat(l.cantidad) > 0
    ).map((l) => ({
      productoId: l.productoId,
      codigoCabys: l.codigoCabys,
      descripcion: l.descripcion,
      unidadMedida: l.unidadMedida,
      cantidad: l.cantidad,
      precioUnitario: l.precioUnitario,
      descuentoPct: l.descuentoPct || "0",
      tipoImpuesto: l.tipoImpuesto,
    }));

    if (lineasValidas.length === 0) {
      setError("Agrega al menos una línea con descripción y cantidad.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await emitirFactura({
        tipoComprobante,
        tipoPago,
        moneda,
        tipoCambio: "1.00000",
        fecha,
        clienteId: cliente?.id ?? null,
        lineas: lineasValidas,
      });

      if (res.error) { setError(res.error); return; }
      setResultado({ facturaId: res.facturaId!, claveNumerica: res.claveNumerica, numero: res.numero });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Resultado exitoso ─────────────────────────────────────────────────────

  if (resultado) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center space-y-5">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">¡Factura emitida!</h2>
          {resultado.numero && (
            <p className="text-sm text-gray-500 mt-1">Número: <span className="font-mono">{resultado.numero}</span></p>
          )}
          {resultado.claveNumerica && (
            <p className="text-xs font-mono text-gray-400 mt-2 break-all">{resultado.claveNumerica}</p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push(`/ventas/${resultado.facturaId}`)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg"
          >
            Ver comprobante
          </button>
          <button
            onClick={() => {
              setResultado(null);
              setLineas([newLinea()]);
              setCliente(null);
            }}
            className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            Nueva factura
          </button>
        </div>
      </div>
    );
  }

  // ─── Formulario POS ───────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nueva factura</h1>
        <button onClick={() => router.push("/ventas")} className="text-sm text-gray-400 hover:text-gray-600">
          Cancelar
        </button>
      </div>

      {/* Encabezado */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="col-span-2 sm:col-span-1 space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">Tipo</label>
          <select
            className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={tipoComprobante}
            onChange={(e) => setTipoComprobante(e.target.value as TipoComprobante)}
          >
            {TIPOS_COMPROBANTE.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">Pago</label>
          <select
            className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={tipoPago}
            onChange={(e) => setTipoPago(e.target.value)}
          >
            {TIPOS_PAGO.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">Moneda</label>
          <select
            className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={moneda}
            onChange={(e) => setMoneda(e.target.value as "CRC" | "USD")}
          >
            <option value="CRC">CRC ₡</option>
            <option value="USD">USD $</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">Fecha</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
      </div>

      {/* Cliente */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
        <label className="text-xs font-medium text-gray-500 uppercase">Cliente</label>
        <BuscadorCliente clienteSeleccionado={cliente} onSelect={setCliente} />
      </div>

      {/* Líneas */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-orange-500" />
          <h3 className="font-semibold text-gray-800 text-sm">Líneas de venta</h3>
          {sinCabys && (
            <span className="ml-auto flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" /> Productos sin código CABYS
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <th className="px-2 py-2 w-8">#</th>
                <th className="px-2 py-2">Producto / Descripción</th>
                <th className="px-2 py-2 w-20 text-right">Cant.</th>
                <th className="px-2 py-2 w-28 text-right">Precio</th>
                <th className="px-2 py-2 w-16 text-right">Dto%</th>
                <th className="px-2 py-2 w-28">IVA</th>
                <th className="px-2 py-2 w-28 text-right">Total</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((l, i) => (
                <LineaRow
                  key={l.tempId}
                  linea={l}
                  index={i}
                  onChange={updateLinea}
                  onDelete={deleteLinea}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-100">
          <button
            type="button"
            onClick={addLinea}
            className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            <Plus className="h-4 w-4" /> Agregar línea
          </button>
        </div>
      </div>

      {/* Totales + acciones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleEmitir}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Emitir factura
            </button>
            <button
              type="button"
              className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Guardar borrador
            </button>
          </div>
        </div>
        <div>
          <PanelTotales lineas={lineas} />
        </div>
      </div>
    </div>
  );
}
