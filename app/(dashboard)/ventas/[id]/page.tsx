import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { obtenerFactura } from "../actions";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Decimal } from "decimal.js";

const ESTADO_MH_CONFIG: Record<string, { label: string; color: string }> = {
  NO_APLICA: { label: "No aplica", color: "bg-gray-100 text-gray-500" },
  PENDIENTE: { label: "Pendiente MH", color: "bg-orange-100 text-orange-700" },
  EN_PROCESO: { label: "En proceso", color: "bg-blue-100 text-blue-700" },
  ACEPTADA: { label: "Aceptada MH", color: "bg-green-100 text-green-700" },
  RECHAZADA: { label: "Rechazada MH", color: "bg-red-100 text-red-700" },
  ERROR: { label: "Error MH", color: "bg-red-100 text-red-700" },
};

const TIPO_COMPROBANTE: Record<string, string> = {
  FE: "Factura Electrónica", TE: "Tiquete Electrónico", ND: "Nota de Débito",
  NC: "Nota de Crédito", FEC: "Factura Electrónica de Compra",
  REP: "Recibo Electrónico de Pago", NORMAL: "Factura Local",
};

interface Props { params: Promise<{ id: string }> }

export default async function DetalleFacturaPage({ params }: Props) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const { id } = await params;
  const factura = await obtenerFactura(id);
  if (!factura) notFound();

  const mh = ESTADO_MH_CONFIG[factura.estadoMH ?? "NO_APLICA"] ?? ESTADO_MH_CONFIG.NO_APLICA;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/ventas" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {TIPO_COMPROBANTE[factura.tipoComprobante] ?? factura.tipoComprobante}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {factura.consecutivo ?? factura.id}
          </p>
        </div>
        <span className={`ml-auto text-xs px-3 py-1 rounded-full font-medium ${mh.color}`}>
          {mh.label}
        </span>
      </div>

      {/* Datos generales */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-2">Datos generales</h2>
        <Row label="Fecha" value={factura.fecha.toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" })} />
        <Row label="Cliente" value={(factura as { clienteNombre?: string }).clienteNombre ?? "—"} />
        <Row label="Tipo de pago" value={factura.tipoPago ?? "—"} />
        <Row label="Moneda" value={factura.moneda ?? "CRC"} />
        {factura.claveNumerica && (
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Clave numérica</p>
            <p className="font-mono text-xs text-gray-600 break-all">{factura.claveNumerica}</p>
          </div>
        )}
      </div>

      {/* Totales */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-2">Totales</h2>
        <Row label="Subtotal" value={`₡${new Decimal(factura.subtotal ?? "0").toDecimalPlaces(2).toNumber().toLocaleString("es-CR", { minimumFractionDigits: 2 })}`} />
        {new Decimal(factura.descuento ?? "0").gt(0) && (
          <Row label="Descuento" value={`-₡${new Decimal(factura.descuento ?? "0").toDecimalPlaces(2).toNumber().toLocaleString("es-CR", { minimumFractionDigits: 2 })}`} />
        )}
        <Row label="IVA" value={`₡${new Decimal(factura.impuesto ?? "0").toDecimalPlaces(2).toNumber().toLocaleString("es-CR", { minimumFractionDigits: 2 })}`} />
        <div className="border-t border-gray-100 pt-3">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-800">Total</span>
            <span className="font-bold text-xl text-gray-900">
              ₡{new Decimal(factura.total ?? "0").toDecimalPlaces(2).toNumber().toLocaleString("es-CR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3 flex-wrap">
        {(factura.estadoMH === "PENDIENTE" || factura.estadoMH === "ERROR") && (
          <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg">
            Enviar a Hacienda
          </button>
        )}
        <button className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
          Imprimir tiquete
        </button>
        <button className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
          Descargar PDF
        </button>
        {factura.estado === "ACTIVA" && (
          <button className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50">
            Anular
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}
