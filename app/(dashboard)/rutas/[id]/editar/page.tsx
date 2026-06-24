import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { obtenerRuta, obtenerClientesParaRuta, obtenerUsuariosEmpresa } from "../../actions";
import { WizardRuta } from "@/components/rutas/wizard-ruta";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props { params: Promise<{ id: string }> }

export default async function EditarRutaPage({ params }: Props) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const { id } = await params;
  const [ruta, clientes, usuarios] = await Promise.all([
    obtenerRuta(id),
    obtenerClientesParaRuta(id),
    obtenerUsuariosEmpresa(),
  ]);
  if (!ruta) notFound();

  const clientesEnRuta = clientes
    .filter((c) => c.rutaId === id)
    .sort((a, b) => (a.ordenEnRuta ?? 0) - (b.ordenEnRuta ?? 0))
    .map((c, i) => ({ id: c.id, nombre: c.nombre, codigoNegocio: c.codigoNegocio, orden: c.ordenEnRuta ?? i + 1 }));

  // Extract zonas from notas if present
  const notasLines = (ruta.notas ?? "").split("\n\nZonas de cobertura: ");
  const notasGenerales = notasLines[0] ?? "";
  const zonasCobertura = notasLines[1] ?? "";

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/rutas/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar ruta</h1>
          <p className="text-sm text-gray-500 mt-0.5">{ruta.nombre}</p>
        </div>
      </div>

      <WizardRuta
        rutaId={id}
        inicial={{
          nombre: ruta.nombre,
          codigo: ruta.codigo,
          dias: ruta.dias ?? [],
          responsableId: ruta.responsableId ?? "",
          vehiculo: ruta.vehiculo ?? "",
          notasGenerales,
          zonasCobertura,
          clientesAsignados: clientesEnRuta,
        }}
        clientes={clientes}
        usuarios={usuarios}
      />
    </div>
  );
}
