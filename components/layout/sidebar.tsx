"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Users,
  Package,
  Box,
  Truck,
  BarChart2,
  Settings,
  ChevronDown,
  Plus,
  List,
  ArrowLeftRight,
  Store,
  Building2,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Nav config ──────────────────────────────────────────────────────────────

type NavChild = { href: string; label: string };
type NavItem =
  | { href: string; label: string; icon: React.ElementType; children?: never }
  | { href?: never; label: string; icon: React.ElementType; children: NavChild[] };

const NAV: NavItem[] = [
  { href: "/control", label: "Control", icon: LayoutDashboard },
  {
    label: "Ventas",
    icon: FileText,
    children: [
      { href: "/ventas/nueva", label: "Nueva factura" },
      { href: "/ventas", label: "Comprobantes" },
    ],
  },
  { href: "/compras", label: "Compras", icon: ShoppingCart },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/productos", label: "Productos", icon: Package },
  {
    label: "Inventario",
    icon: Box,
    children: [
      { href: "/inventario", label: "Stock" },
      { href: "/inventario/movimientos", label: "Movimientos" },
    ],
  },
  { href: "/rutas", label: "Rutas", icon: Truck },
  {
    label: "Reportes",
    icon: BarChart2,
    children: [
      { href: "/reportes/ventas-mensuales", label: "Ventas mensuales" },
      { href: "/reportes/ventas-detalladas", label: "Ventas detalladas" },
      { href: "/reportes/compras", label: "Compras" },
      { href: "/reportes/clientes", label: "Clientes" },
      { href: "/reportes/creditos", label: "Créditos" },
      { href: "/reportes/inventario", label: "Inventario vendido" },
      { href: "/reportes/precios", label: "Precios inventario" },
      { href: "/reportes/iva-ventas", label: "IVA ventas (F-150)" },
      { href: "/reportes/iva-compras", label: "IVA compras" },
    ],
  },
  {
    label: "Configuración",
    icon: Settings,
    children: [
      { href: "/configuracion/empresa", label: "Empresa" },
      { href: "/configuracion/usuarios", label: "Usuarios" },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();

  // Pre-expand sections that contain the active path
  const initialOpen: Record<string, boolean> = {};
  for (const item of NAV) {
    if (item.children) {
      if (item.children.some((c) => pathname.startsWith(c.href))) {
        initialOpen[item.label] = true;
      }
    }
  }

  const [open, setOpen] = useState<Record<string, boolean>>(initialOpen);

  const toggle = (label: string) =>
    setOpen((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <aside
      className="flex flex-col w-52 shrink-0 h-full overflow-y-auto"
      style={{ background: "#1e2130" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/10">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "#E85D24" }}
        >
          <Store size={15} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-white/90 truncate">SistemaGan</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map((item) => {
          if (!item.children) {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "border-l-2 rounded-l-none pl-[9px] text-[#E85D24]"
                    : "text-white/55 hover:text-white/80 hover:bg-white/5"
                )}
                style={
                  isActive
                    ? { borderColor: "#E85D24", background: "rgba(232,93,36,0.12)" }
                    : {}
                }
              >
                <Icon size={16} className="shrink-0" />
                {item.label}
              </Link>
            );
          }

          // Collapsible group
          const isGroupActive = item.children.some((c) => pathname.startsWith(c.href));
          const isOpen = open[item.label] ?? false;
          const Icon = item.icon;

          return (
            <div key={item.label}>
              <button
                onClick={() => toggle(item.label)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors",
                  isGroupActive ? "text-white/90" : "text-white/55 hover:text-white/80 hover:bg-white/5"
                )}
              >
                <Icon size={16} className="shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown
                  size={13}
                  className="shrink-0 transition-transform"
                  style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>

              {isOpen && (
                <div className="ml-6 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                  {item.children.map((child) => {
                    const isActive = pathname === child.href || pathname.startsWith(child.href + "/");
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block px-2 py-1.5 rounded-md text-xs transition-colors",
                          isActive
                            ? "font-medium"
                            : "text-white/45 hover:text-white/70"
                        )}
                        style={isActive ? { color: "#E85D24" } : {}}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
