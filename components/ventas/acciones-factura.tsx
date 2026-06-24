"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { anularFactura, reenviarAHacienda, refrescarEstadoMH } from "@/app/(dashboard)/ventas/actions";
import type { TipoComprobante } from "@/domain/facturacion/tipos";
import { TIPOS_COMPROBANTE_ELECTRONICOS } from "@/domain/facturacion/tipos";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  facturaId: string;
  tipoComprobante: TipoComprobante | string;
  estadoMH: string;
  estadoFactura: string;
  consecutivo: string | null;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function AccionesFactura({
  facturaId,
  tipoComprobante,
  estadoMH,
  estadoFactura,
  consecutivo,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [modal, setModal] = useState<"reenvio" | "anular" | null>(null);

  const esElectronica = TIPOS_COMPROBANTE_ELECTRONICOS.includes(tipoComprobante as TipoComprobante);

  function showMsg(tipo: "ok" | "error", texto: string) {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 6000);
  }

  function handlePDF() {
    window.open(`/api/ventas/${facturaId}/pdf`, "_blank");
  }

  function handleTiquete() {
    window.open(`/api/ventas/${facturaId}/tiquete`, "_blank");
  }

  function handleRefrescar() {
    startTransition(async () => {
      const r = await refrescarEstadoMH(facturaId);
      if (r.error) showMsg("error", r.error);
      else showMsg("ok", `Estado actualizado: ${r.estadoMH ?? "sin cambio"}`);
      router.refresh();
    });
  }

  function handleReenvio() {
    setModal("reenvio");
  }

  function confirmarReenvio() {
    setModal(null);
    startTransition(async () => {
      const r = await reenviarAHacienda(facturaId);
      if (r.error) showMsg("error", r.error);
      else showMsg("ok", "Comprobante encolado para reenvío a Hacienda");
    });
  }

  return (
    <div className="space-y-3">
      {/* Mensaje feedback */}
      {mensaje && (
        <div className={`text-sm px-4 py-2 rounded-lg ${
          mensaje.tipo === "ok"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {mensaje.texto}
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleTiquete}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <PrintIcon /> Tiquete 80mm
        </button>

        <button
          onClick={handlePDF}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <PDFIcon /> Descargar PDF
        </button>

        {esElectronica && estadoMH === "EN_PROCESO" && (
          <button
            onClick={handleRefrescar}
            disabled={pending}
            className="flex items-center gap-1.5 px-3 py-2 border border-blue-200 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <RefreshIcon /> Refrescar MH
          </button>
        )}

        {esElectronica && (estadoMH === "PENDIENTE" || estadoMH === "ERROR") && (
          <button
            onClick={handleReenvio}
            disabled={pending}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <SendIcon /> Enviar a Hacienda
          </button>
        )}

        {estadoFactura === "ACTIVA" && tipoComprobante !== "NC" && (
          <button
            onClick={() => setModal("anular")}
            disabled={pending}
            className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 ml-auto"
          >
            <XIcon /> Anular
          </button>
        )}
      </div>

      {/* Modal reenvío */}
      {modal === "reenvio" && (
        <Modal
          title="Reenviar a Hacienda"
          onCancel={() => setModal(null)}
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Se encolará el comprobante <strong>{consecutivo ?? facturaId}</strong> para reenvío a Hacienda.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
              Solo se permite reenvío individual. No se realizan envíos masivos.
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarReenvio}
                className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg"
              >
                Confirmar reenvío
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal anulación */}
      {modal === "anular" && (
        <ModalAnulacion
          facturaId={facturaId}
          consecutivo={consecutivo}
          esElectronica={esElectronica}
          onClose={() => setModal(null)}
          onResult={(tipo, texto) => {
            showMsg(tipo, texto);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ─── Modal de anulación (con razón) ──────────────────────────────────────────

function ModalAnulacion({
  facturaId,
  consecutivo,
  esElectronica,
  onClose,
  onResult,
}: {
  facturaId: string;
  consecutivo: string | null;
  esElectronica: boolean;
  onClose: () => void;
  onResult: (tipo: "ok" | "error", texto: string) => void;
}) {
  const [razon, setRazon] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (!razon.trim()) return;
    startTransition(async () => {
      const r = await anularFactura(facturaId, razon);
      if (r.error) {
        onResult("error", r.error);
      } else {
        onResult("ok",
          esElectronica
            ? `Factura anulada. Nota de Crédito generada: ${r.ncConsecutivo ?? r.ncId}`
            : "Factura anulada correctamente"
        );
        onClose();
      }
    });
  }

  return (
    <Modal title="Anular comprobante" onCancel={onClose}>
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          <strong>Esta acción no se puede deshacer.</strong>
          {esElectronica && (
            <span> Se generará una Nota de Crédito electrónica ({consecutivo ?? "NC"}) que se enviará a Hacienda.</span>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Razón de anulación *
          </label>
          <textarea
            value={razon}
            onChange={(e) => setRazon(e.target.value)}
            rows={3}
            placeholder="Ej: Error en el precio del producto, factura duplicada…"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-emerald-400"
            maxLength={255}
          />
          <p className="text-xs text-gray-400 mt-0.5">{razon.length}/255</p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={pending || !razon.trim()}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50"
          >
            {pending ? "Anulando…" : "Confirmar anulación"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal genérico ───────────────────────────────────────────────────────────

function Modal({ title, onCancel, children }: { title: string; onCancel: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onCancel}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ─── Iconos pequeños ──────────────────────────────────────────────────────────

function PrintIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>;
}
function PDFIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
}
function SendIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
}
function RefreshIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}
function XIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}
