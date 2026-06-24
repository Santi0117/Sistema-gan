import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { WizardCliente } from "@/components/clientes/wizard-cliente";
import { obtenerCliente } from "../actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarClientePage({ params }: Props) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const { id } = await params;
  const cliente = await obtenerCliente(id);
  if (!cliente) notFound();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <WizardCliente cliente={cliente} />
    </div>
  );
}
