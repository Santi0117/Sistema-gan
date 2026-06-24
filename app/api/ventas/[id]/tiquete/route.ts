import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { obtenerFactura, obtenerLineasFactura } from "@/app/(dashboard)/ventas/actions";

const TIPO_LABELS: Record<string, string> = {
  FE: "FACTURA ELECTRÓNICA", TE: "TIQUETE ELECTRÓNICO", ND: "NOTA DE DÉBITO",
  NC: "NOTA DE CRÉDITO", FEC: "FACTURA DE COMPRA", REP: "RECIBO DE PAGO", NORMAL: "FACTURA LOCAL",
};
const IVA_LABELS: Record<string, string> = {
  EXENTO: "EXENTO", IVA_0_SIN_CREDITO: "0%*", IVA_1: "1%", IVA_2: "2%",
  IVA_4: "4%", IVA_8: "8%", IVA_13: "13%",
};

function fmt2(n: string | number): string {
  return parseFloat(String(n)).toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function pad(s: string, len: number, right = false): string {
  if (right) return s.slice(0, len).padEnd(len);
  return s.slice(0, len).padStart(len);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const [factura, lineas] = await Promise.all([
    obtenerFactura(id),
    obtenerLineasFactura(id),
  ]);

  if (!factura) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
  }

  const tipoLabel = TIPO_LABELS[factura.tipoComprobante] ?? factura.tipoComprobante;
  const fechaStr = factura.fecha.toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const horaStr = factura.fecha.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
  const moneda = factura.moneda === "USD" ? "USD $" : "CRC ₡";
  const clienteNombre = (factura as { clienteNombre?: string }).clienteNombre ?? "Consumidor Final";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tiquete ${factura.consecutivo ?? id}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11pt;
    width: 80mm;
    margin: 0 auto;
    padding: 4mm;
    color: #000;
    background: #fff;
  }

  h1 { font-size: 13pt; font-weight: bold; text-align: center; margin-bottom: 2px; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .small { font-size: 9pt; }
  .xsmall { font-size: 8pt; }
  .tipo { font-size: 11pt; font-weight: bold; text-align: center; margin: 4px 0; }

  hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
  hr.solid { border-top: 1px solid #000; }

  .row { display: flex; justify-content: space-between; margin: 1px 0; }
  .label { color: #555; }

  table { width: 100%; border-collapse: collapse; margin: 4px 0; }
  th, td { padding: 1px 0; vertical-align: top; }
  th { font-weight: bold; font-size: 9pt; border-bottom: 1px solid #000; }
  td.desc { width: 50%; font-size: 9pt; }
  td.num { width: 16%; text-align: right; font-size: 9pt; }
  td.iva { width: 10%; text-align: center; font-size: 9pt; }
  td.total { width: 24%; text-align: right; font-size: 9pt; font-weight: bold; }

  .total-section { margin-top: 4px; }
  .total-final {
    border-top: 2px solid #000;
    padding-top: 3px;
    margin-top: 3px;
    font-size: 13pt;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
  }
  .clave { font-size: 7pt; word-break: break-all; text-align: center; margin: 4px 0; color: #333; }
  .normativa { font-size: 7pt; text-align: center; color: #555; margin-top: 6px; }

  @media print {
    body { width: 80mm; margin: 0; padding: 3mm; }
    @page { size: 80mm auto; margin: 0; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>

<button class="no-print" onclick="window.print()" style="
  display: block; width: 100%; margin-bottom: 12px; padding: 8px;
  background: #E85D24; color: #fff; border: none; border-radius: 6px;
  font-size: 14px; cursor: pointer; font-weight: bold;">
  🖨 Imprimir tiquete
</button>

<h1>GANADERA EL PRADO S.A.</h1>
<p class="center small">Cédula Jurídica: 3-101-000000</p>
<p class="center small">Tel: 2223-4567 | facturacion@ganaderaprado.cr</p>

<hr>

<p class="tipo">${tipoLabel}</p>
${factura.consecutivo ? `<p class="center small">${factura.consecutivo}</p>` : ""}
<p class="center small">${fechaStr} ${horaStr}</p>

<hr>

<div class="row small"><span class="label">Cliente:</span><span>${clienteNombre.length > 22 ? clienteNombre.slice(0, 22) + "…" : clienteNombre}</span></div>
<div class="row small"><span class="label">Forma pago:</span><span>${factura.tipoPago ?? "—"}</span></div>
<div class="row small"><span class="label">Moneda:</span><span>${moneda}</span></div>

<hr>

<table>
  <thead>
    <tr>
      <th class="desc">Descripción</th>
      <th class="num">Cant</th>
      <th class="iva">IVA</th>
      <th class="total">Total</th>
    </tr>
  </thead>
  <tbody>
    ${lineas.map((l) => `
    <tr>
      <td class="desc">${l.descripcion.length > 20 ? l.descripcion.slice(0, 20) + "…" : l.descripcion}</td>
      <td class="num">${parseFloat(l.cantidad).toFixed(2)}</td>
      <td class="iva">${IVA_LABELS[l.tipoImpuesto] ?? l.tipoImpuesto}</td>
      <td class="total">${fmt2(l.totalLinea)}</td>
    </tr>
    <tr>
      <td colspan="4" class="xsmall" style="color:#555;padding-left:4px">
        ${parseFloat(l.cantidad).toFixed(2)} x ${fmt2(l.precioUnitario)}
        ${parseFloat(l.descuentoMonto) > 0 ? ` - desc. ${fmt2(l.descuentoMonto)}` : ""}
      </td>
    </tr>`).join("")}
  </tbody>
</table>

<hr class="solid">

<div class="total-section">
  <div class="row small"><span>Subtotal</span><span>${fmt2(factura.subtotal ?? "0")}</span></div>
  ${parseFloat(factura.descuento ?? "0") > 0
    ? `<div class="row small"><span>Descuento</span><span>-${fmt2(factura.descuento ?? "0")}</span></div>`
    : ""}
  <div class="row small"><span>IVA</span><span>${fmt2(factura.impuesto ?? "0")}</span></div>
  <div class="total-final">
    <span>TOTAL ${factura.moneda ?? "CRC"}</span>
    <span>${fmt2(factura.total ?? "0")}</span>
  </div>
</div>

${factura.claveNumerica ? `
<hr>
<p class="xsmall center" style="color:#555">Clave numérica:</p>
<p class="clave">${factura.claveNumerica}</p>` : ""}

<hr>
<p class="normativa">
  Aut. Res. MH-DGT-RES-0021-2022<br>
  Ministerio de Hacienda — Costa Rica<br>
  ${factura.estadoMH === "ACEPTADA" ? "✓ Aceptado por Hacienda" : factura.estadoMH === "PENDIENTE" ? "⏳ Pendiente MH" : ""}
</p>

</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
