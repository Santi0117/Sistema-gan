"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearRuta, actualizarRuta } from "@/app/(dashboard)/rutas/actions";
import type { ClienteOpcion, ClienteAsignado } from "./paso-clientes-drag";
import { PasoClientesDrag } from "./paso-clientes-drag";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardState {
  nombre: string;
  codigo: string;
  dias: string[];
  responsableId: string;
  vehiculo: string;
  notasGenerales: string;
  zonasCobertura: string;
  clientesAsignados: ClienteAsignado[];
}

interface Props {
  rutaId?: string;
  inicial?: Partial<WizardState>;
  clientes: ClienteOpcion[];
  usuarios: { id: string; nombre: string }[];
}

const DIAS_SEMANA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

const PASOS = [
  { n: 1, label: "Datos generales" },
  { n: 2, label: "Zonas" },
  { n: 3, label: "Clientes" },
  { n: 4, label: "Resumen" },
];

// ─── Wizard ───────────────────────────────────────────────────────────────────

export function WizardRuta({ rutaId, inicial, clientes, usuarios }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [paso, setPaso] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<WizardState>({
    nombre: inicial?.nombre ?? "",
    codigo: inicial?.codigo ?? "",
    dias: inicial?.dias ?? [],
    responsableId: inicial?.responsableId ?? "",
    vehiculo: inicial?.vehiculo ?? "",
    notasGenerales: inicial?.notasGenerales ?? "",
    zonasCobertura: inicial?.zonasCobertura ?? "",
    clientesAsignados: inicial?.clientesAsignados ?? [],
  });

  function set<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function toggleDia(dia: string) {
    set("dias", state.dias.includes(dia)
      ? state.dias.filter((d) => d !== dia)
      : [...state.dias, dia]
    );
  }

  function validarPaso1() {
    if (!state.nombre.trim()) return "El nombre es obligatorio";
    if (!state.codigo.trim()) return "El código es obligatorio";
    if (state.dias.length === 0) return "Seleccioná al menos un día";
    return null;
  }

  function avanzar() {
    if (paso === 1) {
      const err = validarPaso1();
      if (err) { setError(err); return; }
    }
    setError(null);
    setPaso((p) => p + 1);
  }

  function retroceder() {
    setError(null);
    setPaso((p) => p - 1);
  }

  function guardar() {
    startTransition(async () => {
      const data = {
        nombre: state.nombre.trim(),
        codigo: state.codigo.trim().toUpperCase(),
        dias: state.dias,
        responsableId: state.responsableId || null,
        vehiculo: state.vehiculo.trim(),
        notas: state.notasGenerales.trim(),
        zonasCobertura: state.zonasCobertura.trim(),
      };
      const ordenados = state.clientesAsignados.map((c, i) => ({ id: c.id, orden: i + 1 }));

      const r = rutaId
        ? await actualizarRuta(rutaId, data, ordenados)
        : await crearRuta(data, ordenados);

      if (r.error) {
        setError(r.error);
        return;
      }

      router.push(rutaId ? `/rutas/${rutaId}` : `/rutas/${(r as { rutaId?: string }).rutaId}`);
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-0">
        {PASOS.map((p, i) => (
          <div key={p.n} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => paso > p.n && setPaso(p.n)}
              className={`flex items-center gap-2 ${paso > p.n ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                paso === p.n
                  ? "bg-emerald-500 text-white"
                  : paso > p.n
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-400"
              }`}>
                {paso > p.n ? "✓" : p.n}
              </div>
              <span className={`text-xs hidden sm:block ${paso === p.n ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                {p.label}
              </span>
            </button>
            {i < PASOS.length - 1 && (
              <div className={`flex-1 h-px mx-2 ${paso > p.n ? "bg-green-300" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Contenido del paso */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {paso === 1 && <Paso1 state={state} set={set} toggleDia={toggleDia} usuarios={usuarios} />}
        {paso === 2 && <Paso2 state={state} set={set} />}
        {paso === 3 && (
          <Paso3
            clientes={clientes}
            rutaId={rutaId}
            asignados={state.clientesAsignados}
            onChange={(a) => set("clientesAsignados", a)}
          />
        )}
        {paso === 4 && <Paso4 state={state} clientes={clientes} usuarios={usuarios} />}
      </div>

      {/* Navegación */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={paso === 1 ? () => router.back() : retroceder}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          {paso === 1 ? "Cancelar" : "← Anterior"}
        </button>

        {paso < 4 ? (
          <button
            type="button"
            onClick={avanzar}
            className="px-5 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg"
          >
            Siguiente →
          </button>
        ) : (
          <button
            type="button"
            onClick={guardar}
            disabled={pending}
            className="px-5 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg disabled:opacity-50"
          >
            {pending ? "Guardando…" : rutaId ? "Guardar cambios" : "Crear ruta"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Paso 1: Datos generales ──────────────────────────────────────────────────

function Paso1({
  state, set, toggleDia, usuarios,
}: {
  state: WizardState;
  set: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
  toggleDia: (d: string) => void;
  usuarios: { id: string; nombre: string }[];
}) {
  const DIAS_SEMANA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-gray-800">Datos generales</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nombre *">
          <input
            type="text"
            value={state.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            placeholder="Ej: Ruta Norte"
            className={input}
          />
        </Field>
        <Field label="Código *">
          <input
            type="text"
            value={state.codigo}
            onChange={(e) => set("codigo", e.target.value.toUpperCase())}
            placeholder="Ej: RN-001"
            maxLength={20}
            className={input}
          />
        </Field>
      </div>

      <Field label="Días de operación *">
        <div className="flex flex-wrap gap-2 pt-1">
          {DIAS_SEMANA.map((dia) => (
            <button
              key={dia}
              type="button"
              onClick={() => toggleDia(dia)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${
                state.dias.includes(dia)
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "border-gray-200 text-gray-600 hover:border-emerald-300"
              }`}
            >
              {dia}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Responsable">
          <select
            value={state.responsableId}
            onChange={(e) => set("responsableId", e.target.value)}
            className={input}
          >
            <option value="">— Sin asignar —</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
        </Field>
        <Field label="Vehículo">
          <input
            type="text"
            value={state.vehiculo}
            onChange={(e) => set("vehiculo", e.target.value)}
            placeholder="Ej: Toyota HiAce ABC-123"
            className={input}
          />
        </Field>
      </div>

      <Field label="Notas">
        <textarea
          value={state.notasGenerales}
          onChange={(e) => set("notasGenerales", e.target.value)}
          placeholder="Instrucciones, observaciones generales…"
          rows={3}
          className={`${input} resize-none`}
        />
      </Field>
    </div>
  );
}

// ─── Paso 2: Zonas de cobertura ───────────────────────────────────────────────

function Paso2({
  state, set,
}: {
  state: WizardState;
  set: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
}) {
  const SUGERENCIAS = [
    "San José Centro", "Heredia", "Alajuela", "Cartago", "Desamparados",
    "Escazú", "Santa Ana", "Tibás", "Moravia", "La Unión",
  ];

  function agregarSugerencia(zona: string) {
    const actual = state.zonasCobertura;
    if (actual.includes(zona)) return;
    set("zonasCobertura", actual ? `${actual}, ${zona}` : zona);
  }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-gray-800">Zonas de cobertura</h2>
      <p className="text-sm text-gray-500">
        Describí las áreas geográficas que cubre esta ruta (cantones, zonas, sectores).
      </p>

      <Field label="Zonas cubiertas">
        <textarea
          value={state.zonasCobertura}
          onChange={(e) => set("zonasCobertura", e.target.value)}
          placeholder="Ej: Heredia centro, Belén, Flores, San Pablo…"
          rows={4}
          className={`${input} resize-none`}
        />
      </Field>

      <div>
        <p className="text-xs text-gray-500 mb-2">Sugerencias rápidas:</p>
        <div className="flex flex-wrap gap-1.5">
          {SUGERENCIAS.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => agregarSugerencia(z)}
              className="px-2.5 py-1 text-xs border border-gray-200 rounded-full text-gray-600 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
            >
              + {z}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Paso 3: Clientes (drag & drop) ──────────────────────────────────────────

function Paso3({
  clientes, rutaId, asignados, onChange,
}: {
  clientes: ClienteOpcion[];
  rutaId?: string;
  asignados: ClienteAsignado[];
  onChange: (a: ClienteAsignado[]) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Asignación de clientes</h2>
      <p className="text-sm text-gray-500">
        Agregá los clientes que visita esta ruta y ordenálos arrastrando.
      </p>
      <PasoClientesDrag
        todosClientes={clientes}
        rutaId={rutaId}
        asignados={asignados}
        onChange={onChange}
      />
    </div>
  );
}

// ─── Paso 4: Resumen ──────────────────────────────────────────────────────────

function Paso4({
  state, clientes, usuarios,
}: {
  state: WizardState;
  clientes: ClienteOpcion[];
  usuarios: { id: string; nombre: string }[];
}) {
  const responsable = usuarios.find((u) => u.id === state.responsableId);

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-gray-800">Resumen de la ruta</h2>

      <div className="rounded-lg border border-gray-100 divide-y divide-gray-50">
        <SummaryRow label="Nombre" value={state.nombre} />
        <SummaryRow label="Código" value={state.codigo} />
        <SummaryRow label="Días" value={state.dias.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ") || "—"} />
        <SummaryRow label="Responsable" value={responsable?.nombre ?? "Sin asignar"} />
        <SummaryRow label="Vehículo" value={state.vehiculo || "—"} />
        {state.zonasCobertura && <SummaryRow label="Zonas" value={state.zonasCobertura} />}
        {state.notasGenerales && <SummaryRow label="Notas" value={state.notasGenerales} />}
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Clientes asignados ({state.clientesAsignados.length})
        </p>
        {state.clientesAsignados.length === 0 ? (
          <p className="text-sm text-gray-400">Sin clientes asignados</p>
        ) : (
          <ol className="space-y-1">
            {state.clientesAsignados.map((c, i) => (
              <li key={c.id} className="flex items-center gap-2 text-sm">
                <span className="text-xs text-gray-400 w-5 text-right">{i + 1}.</span>
                <span className="text-gray-700">{c.nombre}</span>
                {c.codigoNegocio && <span className="text-xs text-gray-400">({c.codigoNegocio})</span>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const input = "w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-400 bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 px-3 py-2.5 text-sm">
      <span className="text-gray-400 w-28 shrink-0">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}
