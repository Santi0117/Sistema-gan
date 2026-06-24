import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { NuevaFactura } from "@/components/ventas/nueva-factura";

export default async function NuevaFacturaPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  return <NuevaFactura />;
}
