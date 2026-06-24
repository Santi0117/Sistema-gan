import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ProductoForm } from "@/components/productos/producto-form";
import { crearProducto } from "../actions";

export default async function NuevoProductoPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <ProductoForm action={crearProducto} titulo="Nuevo producto" />
    </div>
  );
}
