"use client";

import { useState } from "react";
import Link from "next/link";
import Decimal from "decimal.js";
import { FiltrosComprobantes } from "./filtros-comprobantes";
import { exportarFacturasExcel } from "@/app/(dashboard)/ventas/actions";

const ESTADO_MH: Record<string, { label: string; color: string }> = {
  NO_APLICA: { label: "N/A", color: "bg-gray-100 text-gray-500" },
  PENDIENTE: { label: "Pendiente", color: "bg-emerald-100 text-emerald-700" },
  EN_PROCESO: { label: "En proceso", color: "bg-blue-100 text-blue-700" },
  ACEPTADA: { label: "Aceptada", color: "bg-green-100 text-green-700" },
  RECHAZADA: { label: "Rechazada", color: "bg-red-100 text-red-700" },
  ERROR: { label: "Error", color: "bg-red-100 text-red-700" },
};

const TIPO_COMPROBANTE: Record<string, string> = {
  FE: "Factura Elect.", TE: "Tiquete Elect.", ND: "Nota Débito",
  NC: "Nota Crédito", FEC: "F. Compra", REP: "Recibo Pago", NORMAL: "Factura Local",
};

const TIPO_PAGO: Record<string, string> = {
  CONTADO: "Contado", CREDITO: "Crédito", TRANSFERENCIA: "Transferencia",
  SINPE_MOVIL: "SINPE Móvil", TARJETA: "Tarjeta", PLATAFORMA_DIGITAL: "Digital",
};

interface Factura {
  id: string;
  consecutivo: string | null;
  tipoComprobante: string;
  tipoPago: string | null;
  moneda: string | null;
  fecha: Date;
  total: string | null;
  impuesto: string | null;
  subtotal: string | null;
  descuento: string | null;
  estado: string | null;
  estadoMH: string | null;
  clienteNombre?: string;
}

interface Props {
  facturas: Factura[];
  filtros: {
    tipo?: string;
    estado?: string;
    estadoMH?: string;
    pago?: string;
    desde?: string;
    hasta?: string;
  };
}

export function TablaComprobantes({ facturas, filtros }: Props) {
  const [exportando, setExportando] = useState(false);

  async function handleExportExcel() {
    setExportando(true);
    try {
      const r = await exportarFacturasExcel();
      if (r.base64) {
        const bin = atob(r.base64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        const blob = new Blob([arr], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `comprobantes-${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExportando(false);
    }
  }

  // Client-side filter (server already passed filtered results, but search params filter here for instant UX)
  const filtered = facturas.filter((f) => {
    if (filtros.tipo && f.tipoComprobante !== filtros.tipo) return false;
    if (filtros.estado && f.estado !== filtros.estado) return false;
    if (filtros.estadoMH && f.estadoMH !== filtros.estadoMH) return false;
    if (filtros.pago && f.tipoPago !== filtros.pago) return false;
    if (filtros.desde) {
      const desde = new Date(filtros.desde);
      if (f.fecha < desde) return false;
    }
    if (filtros.hasta) {
      const hasta = new Date(filtros.hasta);
      hasta.setHours(23, 59, 59, 999);
      if (f.fecha > hasta) return false;
    }
    return true;
  });

  return (
    <>
      <FiltrosComprobantes onExportExcel={handleExportExcel} exportando={exportando} />

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-gray-500 text-sm">No hay comprobantes con esos filtros.</p>
            <Link href="/ventas/nueva" className="inline-block text-sm text-emerald-600 font-medium">
              Emitir nueva factura →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Fecha</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Consecutivo</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Cliente</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Pago</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Estado MH</th>
                  <th className="px-4 py-3 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((f) => {
                  const mh = ESTADO_MH[f.estadoMH ?? "NO_APLICA"] ?? ESTADO_MH.NO_APLICA;
                  const esAnulada = f.estado === "ANULADA";
                  return (
                    <tr key={f.id} className={`hover:bg-gray-50 transition-colors ${esAnulada ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {f.fecha.toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-gray-700">
                          {TIPO_COMPROBANTE[f.tipoComprobante] ?? f.tipoComprobante}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {f.consecutivo ? f.consecutivo.slice(-8) : "—"}
                      </td>
                      <td className={`px-4 py-3 ${esAnulada ? "line-through text-gray-400" : "text-gray-800"}`}>
                        {f.clienteNombre ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {TIPO_PAGO[f.tipoPago ?? ""] ?? f.tipoPago ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        ₡{new Decimal(f.total ?? "0").toDecimalPlaces(0).toNumber().toLocaleString("es-CR")}
                      </td>
                      <td className="px-4 py-3">
                        {esAnulada ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Anulada</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Activa</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${mh.color}`}>
                          {mh.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/ventas/${f.id}`}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-right">
        {filtered.length} de {facturas.length} comprobante{facturas.length !== 1 ? "s" : ""}
      </p>
    </>
  );
}
