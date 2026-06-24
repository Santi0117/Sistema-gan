"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  TIPOS_ID_CLIENTE,
  TIPOS_ID_CLIENTE_LABEL,
  type ClienteInput,
} from "@/lib/zod-schemas";
import {
  PROVINCIAS,
  getCantones,
  getDistritos,
} from "@/lib/costa-rica-geo";
import { crearCliente, actualizarCliente } from "@/app/(dashboard)/clientes/actions";
import type { Cliente } from "@/infrastructure/db/schema";
import {
  Check,
  ChevronRight,
  Search,
  Loader2,
  Plus,
  X,
  User,
  MapPin,
  ClipboardList,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type WizardData = Partial<ClienteInput>;

interface WizardClienteProps {
  cliente?: Cliente;
}

type TipoId = (typeof TIPOS_ID_CLIENTE)[number];

const TIPOS_CON_CEDULA: TipoId[] = ["FISICA", "JURIDICA", "DIMEX", "NITE"];

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ paso, total = 3 }: { paso: number; total?: number }) {
  const pasos = ["Identificación", "Contacto", "Resumen"];
  return (
    <div className="flex items-center gap-2 mb-6">
      {pasos.map((label, i) => {
        const num = i + 1;
        const done = num < paso;
        const current = num === paso;
        return (
          <div key={num} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done
                    ? "bg-emerald-500 text-white"
                    : current
                      ? "bg-emerald-100 text-emerald-600 ring-2 ring-orange-500"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : num}
              </div>
              <span
                className={`text-sm font-medium ${
                  current ? "text-gray-900" : done ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < total - 1 && <ChevronRight className="h-4 w-4 text-gray-300 mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Paso 1: Identificación ───────────────────────────────────────────────────

function Paso1({
  data,
  onChange,
  onNext,
}: {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
  onNext: () => void;
}) {
  const [buscandoHacienda, setBuscandoHacienda] = useState(false);
  const [haciendaMsg, setHaciendaMsg] = useState("");

  const tipo = (data.tipoIdentificacion as TipoId) ?? "JURIDICA";
  const tieneCedula = TIPOS_CON_CEDULA.includes(tipo);

  const buscarHacienda = useCallback(async () => {
    const id = data.identificacion?.replace(/\D/g, "") ?? "";
    if (id.length < 9) return;
    setBuscandoHacienda(true);
    setHaciendaMsg("");
    try {
      const res = await fetch(`/api/contribuyente?id=${encodeURIComponent(id)}`);
      if (!res.ok) {
        setHaciendaMsg("No encontrado en Hacienda.");
        return;
      }
      const json = await res.json();
      onChange({
        nombre: json.nombre ?? data.nombre,
        actividadEconomicaReceptor:
          json.actividades?.[0]?.codigo ?? data.actividadEconomicaReceptor,
        contribuyente: true,
      });
      setHaciendaMsg(`✓ ${json.nombre} — ${json.situacion}`);
    } catch {
      setHaciendaMsg("Error consultando Hacienda. Ingresá los datos manualmente.");
    } finally {
      setBuscandoHacienda(false);
    }
  }, [data.identificacion, data.nombre, data.actividadEconomicaReceptor, onChange]);

  const valid =
    data.nombre && data.nombre.length > 0 && data.tipoIdentificacion;

  return (
    <div className="space-y-5">
      {/* Tipo identificación */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Tipo de identificación <span className="text-red-500">*</span>
        </label>
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={tipo}
          onChange={(e) =>
            onChange({ tipoIdentificacion: e.target.value as TipoId, identificacion: "" })
          }
        >
          {TIPOS_ID_CLIENTE.map((t) => (
            <option key={t} value={t}>
              {TIPOS_ID_CLIENTE_LABEL[t]}
            </option>
          ))}
        </select>
      </div>

      {/* Cédula + autocompletar */}
      {tieneCedula && (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {tipo === "JURIDICA" ? "Cédula jurídica" : tipo === "FISICA" ? "Cédula física" : tipo}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Sin guiones ni espacios"
              value={data.identificacion ?? ""}
              onChange={(e) => onChange({ identificacion: e.target.value })}
            />
            <button
              type="button"
              onClick={buscarHacienda}
              disabled={buscandoHacienda || !data.identificacion}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-emerald-300 text-emerald-600 rounded-md hover:bg-emerald-50 disabled:opacity-50"
            >
              {buscandoHacienda ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Autocompletar
            </button>
          </div>
          {haciendaMsg && (
            <p
              className={`text-xs ${
                haciendaMsg.startsWith("✓") ? "text-green-600" : "text-amber-600"
              }`}
            >
              {haciendaMsg}
            </p>
          )}
        </div>
      )}

      {/* Nombre */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Nombre completo / Razón social <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Nombre del cliente o empresa"
          value={data.nombre ?? ""}
          onChange={(e) => onChange({ nombre: e.target.value })}
        />
      </div>

      {/* Nombre negocio + código */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Nombre del negocio</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Nombre comercial"
            value={data.nombreNegocio ?? ""}
            onChange={(e) => onChange({ nombreNegocio: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Código cliente</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Ej: CLI001"
            value={data.codigoNegocio ?? ""}
            onChange={(e) => onChange({ codigoNegocio: e.target.value })}
          />
        </div>
      </div>

      {/* Responsable + teléfono */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Responsable de compras</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Nombre del contacto"
            value={data.responsable ?? ""}
            onChange={(e) => onChange({ responsable: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Teléfono</label>
          <input
            type="text"
            inputMode="numeric"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="8 a 20 dígitos"
            value={data.telefono ?? ""}
            onChange={(e) =>
              onChange({ telefono: e.target.value.replace(/\D/g, "").slice(0, 20) })
            }
          />
        </div>
      </div>

      {/* Actividad económica + contribuyente */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Código actividad económica (CIIU)
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Ej: 4711"
            value={data.actividadEconomicaReceptor ?? ""}
            onChange={(e) => onChange({ actividadEconomicaReceptor: e.target.value })}
          />
          <p className="text-xs text-gray-400">Requerido en Facturas de Compra (FEC).</p>
        </div>
        <div className="flex flex-col justify-end space-y-2 pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.contribuyente ?? false}
              onChange={(e) => onChange({ contribuyente: e.target.checked })}
              className="w-4 h-4 accent-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">Contribuyente activo</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.activo ?? true}
              onChange={(e) => onChange({ activo: e.target.checked })}
              className="w-4 h-4 accent-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">Cliente activo</span>
          </label>
        </div>
      </div>

      {/* Crédito */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.tieneCredito ?? false}
            onChange={(e) => onChange({ tieneCredito: e.target.checked })}
            className="w-4 h-4 accent-orange-500"
          />
          <span className="text-sm font-semibold text-gray-700">Habilitado para crédito</span>
        </label>
        {data.tieneCredito && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Días de crédito</label>
              <input
                type="number"
                min="0"
                max="365"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ej: 30"
                value={data.diasCredito ?? 0}
                onChange={(e) => onChange({ diasCredito: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Límite de crédito (₡)</label>
              <input
                type="text"
                inputMode="decimal"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="0.00"
                value={data.limiteCredito ?? "0"}
                onChange={(e) => onChange({ limiteCredito: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!valid}
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
        >
          Siguiente <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Paso 2: Contacto y dirección ─────────────────────────────────────────────

function Paso2({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const correosAdicionales = data.correosAdicionales ?? [];

  const addCorreo = () => {
    if (!nuevoCorreo || correosAdicionales.length >= 4) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoCorreo)) return;
    onChange({ correosAdicionales: [...correosAdicionales, nuevoCorreo] });
    setNuevoCorreo("");
  };

  const removeCorreo = (i: number) => {
    onChange({ correosAdicionales: correosAdicionales.filter((_, idx) => idx !== i) });
  };

  const cantones = getCantones(data.provincia ?? "");
  const distritos = getDistritos(data.provincia ?? "", data.canton ?? "");

  return (
    <div className="space-y-5">
      {/* Correo contacto */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Correo de contacto</label>
        <input
          type="email"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="contacto@empresa.cr"
          value={data.correoContacto ?? ""}
          onChange={(e) => onChange({ correoContacto: e.target.value })}
        />
      </div>

      {/* Correo factura */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Correo para envío de facturas
        </label>
        <input
          type="email"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="facturas@empresa.cr"
          value={data.correoFactura ?? ""}
          onChange={(e) => onChange({ correoFactura: e.target.value })}
        />
      </div>

      {/* Correos adicionales */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Correos adicionales{" "}
          <span className="text-gray-400 font-normal">({correosAdicionales.length}/4)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="otro@empresa.cr"
            value={nuevoCorreo}
            onChange={(e) => setNuevoCorreo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCorreo())}
            disabled={correosAdicionales.length >= 4}
          />
          <button
            type="button"
            onClick={addCorreo}
            disabled={!nuevoCorreo || correosAdicionales.length >= 4}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40"
          >
            <Plus className="h-4 w-4 text-gray-600" />
          </button>
        </div>
        {correosAdicionales.map((c, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-md px-3 py-1.5 text-sm"
          >
            <span className="text-gray-700">{c}</span>
            <button
              type="button"
              onClick={() => removeCorreo(i)}
              className="text-gray-400 hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* País */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">País</label>
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={data.pais ?? "CR"}
          onChange={(e) => onChange({ pais: e.target.value, provincia: "", canton: "", distrito: "" })}
        >
          <option value="CR">Costa Rica</option>
          <option value="US">Estados Unidos</option>
          <option value="MX">México</option>
          <option value="PA">Panamá</option>
          <option value="NI">Nicaragua</option>
          <option value="HN">Honduras</option>
          <option value="GT">Guatemala</option>
          <option value="SV">El Salvador</option>
          <option value="CO">Colombia</option>
          <option value="ES">España</option>
          <option value="OT">Otro</option>
        </select>
      </div>

      {/* Provincia → Cantón → Distrito (solo CR) */}
      {data.pais === "CR" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Provincia</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={data.provincia ?? ""}
              onChange={(e) =>
                onChange({ provincia: e.target.value, canton: "", distrito: "" })
              }
            >
              <option value="">Seleccionar…</option>
              {PROVINCIAS.map((p) => (
                <option key={p.codigo} value={p.codigo}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Cantón</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-400"
              value={data.canton ?? ""}
              disabled={!data.provincia}
              onChange={(e) => onChange({ canton: e.target.value, distrito: "" })}
            >
              <option value="">Seleccionar…</option>
              {cantones.map((c) => (
                <option key={c.codigo} value={c.codigo}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Distrito</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-400"
              value={data.distrito ?? ""}
              disabled={!data.canton}
              onChange={(e) => onChange({ distrito: e.target.value })}
            >
              <option value="">Seleccionar…</option>
              {distritos.map((d) => (
                <option key={d.codigo} value={d.codigo}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Dirección exacta */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Dirección exacta</label>
        <textarea
          rows={2}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          placeholder="100m norte del parque, casa esquinera…"
          value={data.direccion ?? ""}
          onChange={(e) => onChange({ direccion: e.target.value })}
        />
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg"
        >
          ← Atrás
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Revisar resumen <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Paso 3: Resumen ──────────────────────────────────────────────────────────

function Paso3({
  data,
  onBack,
  onSubmit,
  submitting,
  error,
  clienteId,
}: {
  data: WizardData;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string;
  clienteId?: string;
}) {
  const tipo = data.tipoIdentificacion as TipoId | undefined;
  const tieneCedula = tipo && TIPOS_CON_CEDULA.includes(tipo);

  const provinciaLabel =
    PROVINCIAS.find((p) => p.codigo === data.provincia)?.nombre ?? data.provincia ?? "—";
  const cantonLabel =
    getCantones(data.provincia ?? "").find((c) => c.codigo === data.canton)?.nombre ??
    data.canton ?? "—";
  const distritoLabel =
    getDistritos(data.provincia ?? "", data.canton ?? "").find((d) => d.codigo === data.distrito)
      ?.nombre ?? data.distrito ?? "—";

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Sección identificación */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-semibold text-gray-700">Identificación</h3>
        </div>
        <Row label="Tipo" value={tipo ? TIPOS_ID_CLIENTE_LABEL[tipo] : "—"} />
        {tieneCedula && <Row label="Cédula / ID" value={data.identificacion || "—"} />}
        <Row label="Nombre" value={data.nombre || "—"} />
        {data.nombreNegocio && <Row label="Negocio" value={data.nombreNegocio} />}
        {data.codigoNegocio && <Row label="Código" value={data.codigoNegocio} />}
        {data.responsable && <Row label="Responsable" value={data.responsable} />}
        {data.telefono && <Row label="Teléfono" value={data.telefono} />}
        <Row label="Contribuyente" value={data.contribuyente ? "Sí" : "No"} />
        <Row label="Activo" value={data.activo !== false ? "Sí" : "No"} />
        {data.tieneCredito && (
          <>
            <Row label="Crédito" value={`${data.diasCredito} días`} />
            <Row label="Límite" value={`₡${data.limiteCredito}`} />
          </>
        )}
      </div>

      {/* Sección contacto */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-semibold text-gray-700">Contacto y dirección</h3>
        </div>
        {data.correoContacto && <Row label="Correo contacto" value={data.correoContacto} />}
        {data.correoFactura && <Row label="Correo factura" value={data.correoFactura} />}
        {(data.correosAdicionales?.length ?? 0) > 0 && (
          <Row label="Correos adicionales" value={data.correosAdicionales!.join(", ")} />
        )}
        <Row label="País" value={data.pais ?? "CR"} />
        {data.provincia && (
          <Row
            label="Ubicación"
            value={[provinciaLabel, cantonLabel, distritoLabel].filter(Boolean).join(" / ")}
          />
        )}
        {data.direccion && <Row label="Dirección" value={data.direccion} />}
      </div>

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg"
        >
          ← Atrás
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {clienteId ? "Guardar cambios" : "Crear cliente"}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

// ─── Wizard principal ─────────────────────────────────────────────────────────

export function WizardCliente({ cliente }: WizardClienteProps) {
  const router = useRouter();
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [data, setData] = useState<WizardData>(() => ({
    tipoIdentificacion: (cliente?.tipoIdentificacion as TipoId) ?? "JURIDICA",
    identificacion: cliente?.identificacion ?? "",
    nombre: cliente?.nombre ?? "",
    nombreNegocio: cliente?.nombreNegocio ?? "",
    codigoNegocio: cliente?.codigoNegocio ?? "",
    responsable: cliente?.responsable ?? "",
    telefono: cliente?.telefono ?? "",
    actividadEconomicaReceptor: cliente?.actividadEconomicaReceptor ?? "",
    contribuyente: cliente?.contribuyente ?? false,
    tieneCredito: cliente?.tieneCredito ?? false,
    diasCredito: cliente?.diasCredito ?? 0,
    limiteCredito: cliente?.limiteCredito ?? "0",
    activo: cliente?.activo ?? true,
    correoContacto: cliente?.correoContacto ?? "",
    correoFactura: cliente?.correoFactura ?? "",
    correosAdicionales: (cliente?.correosAdicionales as string[]) ?? [],
    pais: cliente?.pais ?? "CR",
    provincia: cliente?.provincia ?? "",
    canton: cliente?.canton ?? "",
    distrito: cliente?.distrito ?? "",
    direccion: cliente?.direccion ?? "",
  }));

  const onChange = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      if (cliente) {
        const result = await actualizarCliente(cliente.id, data);
        if (result?.error) { setError(result.error); setSubmitting(false); return; }
      } else {
        const result = await crearCliente(data);
        if (result?.error) { setError(result.error); setSubmitting(false); return; }
      }
      router.push("/clientes");
      router.refresh();
    } catch {
      setError("Error inesperado. Intenta de nuevo.");
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">
          {cliente ? "Editar cliente" : "Nuevo cliente"}
        </h1>
        <button
          type="button"
          onClick={() => router.push("/clientes")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </button>
      </div>

      <StepIndicator paso={paso} />

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {paso === 1 && (
          <Paso1 data={data} onChange={onChange} onNext={() => setPaso(2)} />
        )}
        {paso === 2 && (
          <Paso2
            data={data}
            onChange={onChange}
            onNext={() => setPaso(3)}
            onBack={() => setPaso(1)}
          />
        )}
        {paso === 3 && (
          <Paso3
            data={data}
            onBack={() => setPaso(2)}
            onSubmit={handleSubmit}
            submitting={submitting}
            error={error}
            clienteId={cliente?.id}
          />
        )}
      </div>
    </div>
  );
}
