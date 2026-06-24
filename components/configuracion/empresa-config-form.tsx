"use client";

import { useState, useTransition, useRef } from "react";
import type { EmpresaConfig } from "@/app/(dashboard)/configuracion/empresa/actions";
import { guardarEmpresaConfig, subirCertificadoP12, probarConexionTribuCR } from "@/app/(dashboard)/configuracion/empresa/actions";

// ─── Pestañas ─────────────────────────────────────────────────────────────────

type Tab = "general" | "hacienda" | "certificado";

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "Datos generales" },
  { id: "hacienda", label: "TRIBU-CR" },
  { id: "certificado", label: "Certificado .p12" },
];

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  empresa: EmpresaConfig;
}

export function EmpresaConfigForm({ empresa }: Props) {
  const [tab, setTab] = useState<Tab>("general");
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  function showMsg(tipo: "ok" | "error", texto: string) {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 5000);
  }

  return (
    <div className="space-y-6">
      {/* Ambiente badge */}
      <div className="flex items-center gap-3">
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            empresa.ambienteMH === "PRUEBAS"
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-green-500/20 text-green-400"
          }`}
        >
          {empresa.ambienteMH === "PRUEBAS" ? "Ambiente SANDBOX" : "Ambiente PRODUCCIÓN"}
        </span>
        {empresa.tieneCertificadoP12 && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-500/20 text-green-400">
            Certificado .p12 activo
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-[#E85D24] text-[#E85D24]"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mensaje de feedback */}
      {mensaje && (
        <div
          className={`text-sm px-4 py-3 rounded-lg ${
            mensaje.tipo === "ok"
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Contenido de cada tab */}
      {tab === "general" && (
        <TabGeneral empresa={empresa} onResult={showMsg} />
      )}
      {tab === "hacienda" && (
        <TabHacienda empresa={empresa} onResult={showMsg} />
      )}
      {tab === "certificado" && (
        <TabCertificado empresa={empresa} onResult={showMsg} />
      )}
    </div>
  );
}

// ─── Tab: Datos generales ────────────────────────────────────────────────────

function TabGeneral({
  empresa,
  onResult,
}: {
  empresa: EmpresaConfig;
  onResult: (tipo: "ok" | "error", texto: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    nombre: empresa.nombre,
    nombreComercial: empresa.nombreComercial ?? "",
    identificacion: empresa.identificacion,
    tipoIdentificacion: empresa.tipoIdentificacion,
    actividadEconomica: empresa.actividadEconomica ?? "",
    correo: empresa.correo,
    correoFactura: empresa.correoFactura ?? "",
    telefono: empresa.telefono ?? "",
    direccion: empresa.direccion ?? "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await guardarEmpresaConfig({ ...form, ambienteMH: empresa.ambienteMH });
      if (result.error) onResult("error", result.error);
      else onResult("ok", "Datos guardados correctamente");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Nombre jurídico *" name="nombre" value={form.nombre} onChange={handleChange} required />
        <FormField label="Nombre comercial" name="nombreComercial" value={form.nombreComercial} onChange={handleChange} />
        <div>
          <label className="block text-xs text-gray-400 mb-1">Tipo de identificación *</label>
          <select
            name="tipoIdentificacion"
            value={form.tipoIdentificacion}
            onChange={handleChange}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="FISICA">Cédula física</option>
            <option value="JURIDICA">Cédula jurídica</option>
            <option value="DIMEX">DIMEX</option>
            <option value="NITE">NITE</option>
          </select>
        </div>
        <FormField label="Número de identificación *" name="identificacion" value={form.identificacion} onChange={handleChange} required />
        <FormField label="Código actividad económica (CIIU4)" name="actividadEconomica" value={form.actividadEconomica} onChange={handleChange} placeholder="Ej: 0121" />
        <FormField label="Teléfono (solo dígitos)" name="telefono" value={form.telefono} onChange={handleChange} placeholder="22234567" />
        <FormField label="Correo electrónico *" name="correo" value={form.correo} onChange={handleChange} type="email" required />
        <FormField label="Correo de facturación" name="correoFactura" value={form.correoFactura} onChange={handleChange} type="email" placeholder="facturacion@empresa.cr" />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Dirección</label>
        <textarea
          name="direccion"
          value={form.direccion}
          onChange={handleChange}
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="bg-[#E85D24] hover:bg-[#d44f1a] text-white text-sm font-medium px-6 py-2 rounded-lg disabled:opacity-50 transition-colors"
        >
          {pending ? "Guardando…" : "Guardar datos"}
        </button>
      </div>
    </form>
  );
}

// ─── Tab: TRIBU-CR ───────────────────────────────────────────────────────────

function TabHacienda({
  empresa,
  onResult,
}: {
  empresa: EmpresaConfig;
  onResult: (tipo: "ok" | "error", texto: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [testing, startTest] = useTransition();
  const [form, setForm] = useState({
    usuarioTribuCR: empresa.usuarioTribuCR ?? "",
    claveTribuCR: "",
    ambienteMH: empresa.ambienteMH,
    proveedorSistemasId: empresa.proveedorSistemasId ?? "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await guardarEmpresaConfig({
        ...empresa,
        usuarioTribuCR: form.usuarioTribuCR,
        claveTribuCR: form.claveTribuCR || undefined,
        ambienteMH: form.ambienteMH as "PRUEBAS" | "PRODUCCION",
        proveedorSistemasId: form.proveedorSistemasId,
      });
      if (result.error) onResult("error", result.error);
      else onResult("ok", "Credenciales guardadas correctamente");
    });
  }

  function handleTest() {
    startTest(async () => {
      const result = await probarConexionTribuCR();
      if (result.error) onResult("error", result.error);
      else onResult("ok", result.mensaje ?? "Conexión exitosa");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-300">
        <strong>Importante:</strong> Siempre configure y pruebe primero en ambiente SANDBOX (Pruebas) antes de cambiar a Producción.
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Ambiente Hacienda</label>
        <select
          name="ambienteMH"
          value={form.ambienteMH}
          onChange={handleChange}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="PRUEBAS">Pruebas (Sandbox)</option>
          <option value="PRODUCCION">Producción</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Usuario TRIBU-CR (OVi)"
          name="usuarioTribuCR"
          value={form.usuarioTribuCR}
          onChange={handleChange}
          placeholder={empresa.usuarioTribuCR === "***" ? "• • • configurado" : "usuario@correo.com"}
        />
        <FormField
          label={empresa.usuarioTribuCR === "***" ? "Contraseña TRIBU-CR (dejar vacío para no cambiar)" : "Contraseña TRIBU-CR"}
          name="claveTribuCR"
          value={form.claveTribuCR}
          onChange={handleChange}
          type="password"
          placeholder={empresa.usuarioTribuCR === "***" ? "• • • •" : "Contraseña"}
        />
        <FormField
          label="Cédula proveedor de sistemas (software)"
          name="proveedorSistemasId"
          value={form.proveedorSistemasId}
          onChange={handleChange}
          placeholder="3101000000"
        />
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing || !empresa.usuarioTribuCR}
          className="text-sm text-[#E85D24] border border-[#E85D24]/40 px-4 py-2 rounded-lg hover:bg-[#E85D24]/10 disabled:opacity-40 transition-colors"
        >
          {testing ? "Probando…" : "Probar conexión"}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="bg-[#E85D24] hover:bg-[#d44f1a] text-white text-sm font-medium px-6 py-2 rounded-lg disabled:opacity-50 transition-colors"
        >
          {pending ? "Guardando…" : "Guardar credenciales"}
        </button>
      </div>
    </form>
  );
}

// ─── Tab: Certificado .p12 ───────────────────────────────────────────────────

function TabCertificado({
  empresa,
  onResult,
}: {
  empresa: EmpresaConfig;
  onResult: (tipo: "ok" | "error", texto: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [pin, setPin] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { onResult("error", "Seleccione un archivo .p12"); return; }
    if (!pin) { onResult("error", "Ingrese el PIN del certificado"); return; }

    const formData = new FormData();
    formData.append("p12", file);
    formData.append("pin", pin);

    startTransition(async () => {
      const result = await subirCertificadoP12(formData);
      if (result.error) onResult("error", result.error);
      else {
        onResult("ok", "Certificado .p12 cargado correctamente");
        setPin("");
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-300">
        La llave criptográfica (.p12) se descarga de la <strong>OVi (Oficina Virtual de Hacienda)</strong>. Tiene vigencia de 4 años.
        Se almacena cifrada en la base de datos.
      </div>

      {empresa.tieneCertificadoP12 && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Hay un certificado .p12 cargado. Puede reemplazarlo subiendo uno nuevo.
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Archivo .p12 / .pfx *</label>
          <input
            ref={fileRef}
            type="file"
            accept=".p12,.pfx"
            className="w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#E85D24] file:text-white hover:file:bg-[#d44f1a] file:cursor-pointer"
          />
        </div>
        <div className="max-w-xs">
          <label className="block text-xs text-gray-400 mb-1">PIN del certificado *</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN de la OVi"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="bg-[#E85D24] hover:bg-[#d44f1a] text-white text-sm font-medium px-6 py-2 rounded-lg disabled:opacity-50 transition-colors"
        >
          {pending ? "Subiendo…" : "Subir certificado"}
        </button>
      </div>
    </form>
  );
}

// ─── FormField reutilizable ───────────────────────────────────────────────────

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600"
      />
    </div>
  );
}
