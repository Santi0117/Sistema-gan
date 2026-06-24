import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

const PAGE_TITLES: Record<string, string> = {
  "/control": "Control",
  "/ventas": "Ventas",
  "/ventas/nueva": "Nueva factura",
  "/compras": "Compras",
  "/clientes": "Clientes",
  "/productos": "Productos",
  "/inventario": "Inventario",
  "/inventario/movimientos": "Movimientos de inventario",
  "/rutas": "Rutas",
  "/configuracion/empresa": "Configuración — Empresa",
  "/configuracion/usuarios": "Configuración — Usuarios",
};

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/reportes/")) return "Reportes";
  if (pathname.startsWith("/ventas/")) return "Factura";
  if (pathname.startsWith("/clientes/")) return "Cliente";
  if (pathname.startsWith("/productos/")) return "Producto";
  if (pathname.startsWith("/rutas/")) return "Ruta";
  return "SistemaGan";
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar
          nombre={session.nombre}
          rol={session.rol}
          title="SistemaGan"
        />
        <main className="flex-1 overflow-auto" style={{ background: "#f7f7f9" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
