import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { obtenerEmpresaConfig } from "./actions";
import { EmpresaConfigForm } from "@/components/configuracion/empresa-config-form";

export default async function EmpresaConfigPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const empresa = await obtenerEmpresaConfig();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configuración de Empresa</h1>
        <p className="text-sm text-gray-400 mt-1">
          Datos fiscales, llave criptográfica y credenciales TRIBU-CR
        </p>
      </div>
      <EmpresaConfigForm empresa={empresa} />
    </div>
  );
}
