import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { obtenerFactura, obtenerLineasFactura } from "@/app/(dashboard)/ventas/actions";

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

  try {
    // Importación dinámica para evitar que @react-pdf/renderer se incluya en el bundle del cliente
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { FacturaPDF } = await import("@/components/pdf/factura-pdf");

    const data = {
      tipoComprobante: factura.tipoComprobante,
      consecutivo: factura.consecutivo,
      claveNumerica: factura.claveNumerica,
      fecha: factura.fecha,
      clienteNombre: (factura as { clienteNombre?: string }).clienteNombre ?? "—",
      tipoPago: factura.tipoPago ?? "CONTADO",
      moneda: factura.moneda ?? "CRC",
      estado: factura.estado ?? "ACTIVA",
      estadoMH: factura.estadoMH ?? "NO_APLICA",
      subtotal: factura.subtotal ?? "0",
      descuento: factura.descuento ?? "0",
      impuesto: factura.impuesto ?? "0",
      total: factura.total ?? "0",
      lineas,
      empresaNombre: "Ganadera El Prado S.A.",
      empresaIdentificacion: "3-101-000000",
      empresaDireccion: "San José, Costa Rica",
      empresaTelefono: "2223-4567",
      empresaCorreo: "facturacion@ganaderaprado.cr",
    };

    const { createElement } = await import("react");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(createElement(FacturaPDF, { data }) as any);

    const consecutivoSlug = (factura.consecutivo ?? id).replace(/[^a-zA-Z0-9-]/g, "");

    return new Response(new Uint8Array(pdfBuffer as Buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="factura-${consecutivoSlug}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[PDF] Error generando PDF:", err);
    return NextResponse.json(
      { error: `Error generando PDF: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
