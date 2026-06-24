import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { obtenerClientesParaRuta, obtenerUsuariosEmpresa } from "../actions";
import { WizardRuta } from "@/components/rutas/wizard-ruta";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NuevaRutaPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const [clientes, usuarios] = await Promise.all([
    obtenerClientesParaRuta(),
    obtenerUsuariosEmpresa(),
  ]);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/rutas" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva ruta</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configurá los detalles en 4 pasos</p>
        </div>
      </div>

      <WizardRuta clientes={clientes} usuarios={usuarios} />
    </div>
  );
}
