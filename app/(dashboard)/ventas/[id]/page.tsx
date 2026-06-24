import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { obtenerFactura, obtenerLineasFactura } from "../actions";
import { AccionesFactura } from "@/components/ventas/acciones-factura";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Decimal from "decimal.js";

const ESTADO_MH_CONFIG: Record<string, { label: string; color: string }> = {
  NO_APLICA: { label: "No aplica", color: "bg-gray-100 text-gray-500" },
  PENDIENTE: { label: "Pendiente MH", color: "bg-orange-100 text-orange-700" },
  EN_PROCESO: { label: "En proceso", color: "bg-blue-100 text-blue-700" },
  ACEPTADA: { label: "Aceptada MH", color: "bg-green-100 text-green-700" },
  RECHAZADA: { label: "Rechazada MH", color: "bg-red-100 text-red-700" },
  ERROR: { label: "Error MH", color: "bg-red-100 text-red-700" },
};

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVA: { label: "Activa", color: "bg-green-100 text-green-700" },
  ANULADA: { label: "Anulada", color: "bg-red-100 text-red-700" },
  PAGADA: { label: "Pagada", color: "bg-blue-100 text-blue-700" },
};

const TIPO_LABELS: Record<string, string> = {
  FE: "Factura Electrónica", TE: "Tiquete Electrónico", ND: "Nota de Débito",
  NC: "Nota de Crédito", FEC: "Factura Electrónica de Compra",
  FEE: "Factura de Exportación", REP: "Recibo Electrónico de Pago", NORMAL: "Factura Local",
};

const PAGO_LABELS: Record<string, string> = {
  CONTADO: "Contado", CREDITO: "Crédito", TRANSFERENCIA: "Transferencia",
  SINPE_MOVIL: "SINPE Móvil", TARJETA: "Tarjeta", PLATAFORMA_DIGITAL: "Digital",
};

const IVA_LABELS: Record<string, string> = {
  EXENTO: "Exento", IVA_0_SIN_CREDITO: "0%*", IVA_1: "1%",
  IVA_2: "2%", IVA_4: "4%", IVA_8: "8%", IVA_13: "13%",
};

interface Props { params: Promise<{ id: string }> }

export default async function DetalleFacturaPage({ params }: Props) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const { id } = await params;
  const [factura, lineas] = await Promise.all([
    obtenerFactura(id),
    obtenerLineasFactura(id),
  ]);
  if (!factura) notFound();

  const mh = ESTADO_MH_CONFIG[factura.estadoMH ?? "NO_APLICA"] ?? ESTADO_MH_CONFIG.NO_APLICA;
  const estado = ESTADO_CONFIG[factura.estado ?? "ACTIVA"] ?? ESTADO_CONFIG.ACTIVA;
  const esAnulada = factura.estado === "ANULADA";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Cabecera */}
      <div className="flex items-start gap-3">
        <Link href="/ventas" className="mt-1 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className={`text-2xl font-bold ${esAnulada ? "text-gray-400 line-through" : "text-gray-900"}`}>
            {TIPO_LABELS[factura.tipoComprobante] ?? factura.tipoComprobante}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 font-mono">
            {factura.consecutivo ?? factura.id}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${estado.color}`}>
            {estado.label}
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${mh.color}`}>
            {mh.label}
          </span>
        </div>
      </div>

      {/* Alerta si anulada */}
      {esAnulada && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          Este comprobante ha sido anulado.
        </div>
      )}

      {/* Datos generales */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2.5">
        <h2 className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-3">Datos generales</h2>
        <Row label="Fecha" value={factura.fecha.toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
        <Row label="Cliente" value={(factura as { clienteNombre?: string }).clienteNombre ?? "—"} />
        <Row label="Forma de pago" value={PAGO_LABELS[factura.tipoPago ?? ""] ?? factura.tipoPago ?? "—"} />
        <Row label="Moneda" value={`${factura.moneda ?? "CRC"}${factura.moneda === "USD" ? ` (TC: ${factura.tipoCambio})` : ""}`} />
        {factura.claveNumerica && (
          <div className="pt-1">
            <p className="text-xs text-gray-400 mb-1">Clave numérica</p>
            <p className="font-mono text-xs text-gray-600 break-all bg-gray-50 rounded p-2 leading-5">
              {factura.claveNumerica}
            </p>
          </div>
        )}
      </div>

      {/* Líneas de detalle */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700 text-xs uppercase tracking-wide">Detalle de líneas</h2>
        </div>
        {lineas.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-400">Sin líneas de detalle</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">Descripción</th>
                  <th className="px-4 py-2.5 font-medium text-right">Cant.</th>
                  <th className="px-4 py-2.5 font-medium text-right">P.Unit</th>
                  <th className="px-4 py-2.5 font-medium text-center">IVA</th>
                  <th className="px-4 py-2.5 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lineas.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{l.linea}</td>
                    <td className="px-4 py-2.5">
                      <p className="text-gray-800">{l.descripcion}</p>
                      {l.codigoCabys && (
                        <p className="text-xs text-gray-400 font-mono mt-0.5">CABYS: {l.codigoCabys}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      {parseFloat(l.cantidad).toFixed(2)} {l.unidadMedida}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      <span>₡{new Decimal(l.precioUnitario).toDecimalPlaces(2).toNumber().toLocaleString("es-CR")}</span>
                      {parseFloat(l.descuentoMonto) > 0 && (
                        <p className="text-xs text-orange-600">-₡{new Decimal(l.descuentoMonto).toDecimalPlaces(2).toNumber().toLocaleString("es-CR")}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${l.tipoImpuesto === "EXENTO" ? "bg-gray-100 text-gray-500" : "bg-orange-100 text-orange-700"}`}>
                        {IVA_LABELS[l.tipoImpuesto] ?? l.tipoImpuesto}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-800">
                      ₡{new Decimal(l.totalLinea).toDecimalPlaces(2).toNumber().toLocaleString("es-CR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totales */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-3">Totales</h2>
        <div className="space-y-2 max-w-xs ml-auto">
          <Row label="Subtotal" value={`₡${new Decimal(factura.subtotal ?? "0").toDecimalPlaces(2).toNumber().toLocaleString("es-CR", { minimumFractionDigits: 2 })}`} />
          {new Decimal(factura.descuento ?? "0").gt(0) && (
            <Row label="Descuento" value={`-₡${new Decimal(factura.descuento ?? "0").toDecimalPlaces(2).toNumber().toLocaleString("es-CR", { minimumFractionDigits: 2 })}`} />
          )}
          <Row label="IVA" value={`₡${new Decimal(factura.impuesto ?? "0").toDecimalPlaces(2).toNumber().toLocaleString("es-CR", { minimumFractionDigits: 2 })}`} />
          <div className="border-t border-gray-100 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-bold text-gray-800">Total {factura.moneda ?? "CRC"}</span>
              <span className="font-bold text-xl text-gray-900">
                ₡{new Decimal(factura.total ?? "0").toDecimalPlaces(2).toNumber().toLocaleString("es-CR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-3">Acciones</h2>
        <AccionesFactura
          facturaId={id}
          tipoComprobante={factura.tipoComprobante}
          estadoMH={factura.estadoMH ?? "NO_APLICA"}
          estadoFactura={factura.estado ?? "ACTIVA"}
          consecutivo={factura.consecutivo}
        />
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
