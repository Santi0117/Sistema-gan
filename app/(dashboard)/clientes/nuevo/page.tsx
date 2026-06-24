import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { WizardCliente } from "@/components/clientes/wizard-cliente";

export default async function NuevoClientePage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <WizardCliente />
    </div>
  );
}
