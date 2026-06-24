"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, ShoppingCart, Users, Package,
  Box, Truck, BarChart2, Settings, ChevronDown, Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavChild = { href: string; label: string };
type NavItem =
  | { href: string; label: string; icon: React.ElementType; children?: never }
  | { href?: never; label: string; icon: React.ElementType; children: NavChild[] };

const NAV: NavItem[] = [
  { href: "/control", label: "Control", icon: LayoutDashboard },
  {
    label: "Ventas", icon: FileText,
    children: [
      { href: "/ventas/nueva", label: "Nueva factura" },
      { href: "/ventas", label: "Comprobantes" },
    ],
  },
  { href: "/compras", label: "Compras", icon: ShoppingCart },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/productos", label: "Productos", icon: Package },
  {
    label: "Inventario", icon: Box,
    children: [
      { href: "/inventario", label: "Stock" },
      { href: "/inventario/movimientos", label: "Movimientos" },
    ],
  },
  { href: "/rutas", label: "Rutas", icon: Truck },
  {
    label: "Reportes", icon: BarChart2,
    children: [
      { href: "/reportes/ventas-mensual", label: "Ventas mensuales" },
      { href: "/reportes/ventas-detallado", label: "Ventas detalladas" },
      { href: "/reportes/compras-mensual", label: "Compras" },
      { href: "/reportes/clientes", label: "Clientes" },
      { href: "/reportes/creditos", label: "Créditos" },
      { href: "/reportes/inventario-vendido", label: "Inventario vendido" },
      { href: "/reportes/precios-inventario", label: "Precios inventario" },
      { href: "/reportes/impuestos-ventas", label: "IVA ventas (D-150)" },
      { href: "/reportes/impuestos-compras", label: "IVA compras" },
    ],
  },
  {
    label: "Configuración", icon: Settings,
    children: [
      { href: "/configuracion/empresa", label: "Empresa" },
      { href: "/configuracion/usuarios", label: "Usuarios" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const initialOpen: Record<string, boolean> = {};
  for (const item of NAV) {
    if (item.children?.some((c) => pathname.startsWith(c.href))) {
      initialOpen[item.label] = true;
    }
  }

  const [open, setOpen] = useState<Record<string, boolean>>(initialOpen);
  const toggle = (label: string) => setOpen((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <aside
      className="flex flex-col w-52 shrink-0 h-full overflow-y-auto relative"
      style={{
        background: "linear-gradient(170deg, #0e2016 0%, #091610 50%, #06120d 100%)",
      }}
    >
      {/* Decorative glow orb at top */}
      <div
        className="absolute top-0 left-0 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
          transform: "translate(-30%, -30%)",
        }}
      />

      {/* Header */}
      <div
        className="relative flex items-center gap-2.5 px-4 py-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(52,211,153,0.1)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 animate-float"
          style={{
            background: "linear-gradient(135deg, #059669 0%, #10b981 60%, #34d399 100%)",
            boxShadow: "0 0 12px rgba(16,185,129,0.4)",
          }}
        >
          <Store size={15} className="text-white" />
        </div>
        <div>
          <span className="text-sm font-semibold text-white/90 truncate block leading-tight">SistemaGan</span>
          <span className="text-[9px] font-medium" style={{ color: "#34d399" }}>Facturación CR v4.4</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative flex-1 px-2 py-3 space-y-0.5">
        {NAV.map((item, i) => {
          if (!item.children) {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-200",
                  isActive
                    ? "border-l-2 rounded-l-none pl-[9px]"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5 hover:translate-x-0.5"
                )}
                style={
                  isActive
                    ? {
                        borderColor: "#34d399",
                        background: "rgba(52,211,153,0.1)",
                        color: "#34d399",
                        boxShadow: "inset 2px 0 8px rgba(52,211,153,0.1)",
                      }
                    : {}
                }
              >
                <Icon size={16} className="shrink-0" />
                {item.label}
              </Link>
            );
          }

          const isGroupActive = item.children.some((c) => pathname.startsWith(c.href));
          const isOpen = open[item.label] ?? false;
          const Icon = item.icon;

          return (
            <div key={item.label}>
              <button
                onClick={() => toggle(item.label)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-200",
                  isGroupActive
                    ? "text-white/90"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5 hover:translate-x-0.5"
                )}
              >
                <Icon size={16} className="shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown
                  size={13}
                  className="shrink-0 transition-transform duration-300"
                  style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>

              <div
                className="ml-6 space-y-0.5 overflow-hidden transition-all duration-300"
                style={{
                  maxHeight: isOpen ? "500px" : "0",
                  opacity: isOpen ? 1 : 0,
                  borderLeft: "1px solid rgba(52,211,153,0.12)",
                  paddingLeft: "12px",
                  marginTop: isOpen ? "2px" : "0",
                }}
              >
                {item.children.map((child) => {
                  const isActive = pathname === child.href || pathname.startsWith(child.href + "/");
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "block px-2 py-1.5 rounded-md text-xs transition-all duration-150",
                        isActive
                          ? "font-semibold"
                          : "text-white/40 hover:text-white/70 hover:translate-x-0.5"
                      )}
                      style={isActive ? { color: "#34d399" } : {}}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer decoration */}
      <div
        className="px-4 py-3 text-[9px] shrink-0"
        style={{ borderTop: "1px solid rgba(52,211,153,0.08)", color: "rgba(255,255,255,0.2)" }}
      >
        v4.4 · TRIBU-CR · Sandbox
      </div>
    </aside>
  );
}
