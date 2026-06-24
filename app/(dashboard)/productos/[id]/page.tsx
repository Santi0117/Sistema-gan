import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { ProductoForm } from "@/components/productos/producto-form";
import { obtenerProducto, actualizarProducto } from "../actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarProductoPage({ params }: Props) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const { id } = await params;
  const producto = await obtenerProducto(id);
  if (!producto) notFound();

  const action = actualizarProducto.bind(null, id);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <ProductoForm
        producto={producto}
        action={action}
        titulo="Editar producto"
      />
    </div>
  );
}
