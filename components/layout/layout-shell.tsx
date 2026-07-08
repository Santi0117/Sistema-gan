"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { UserRole } from "@/lib/session";

interface LayoutShellProps {
  children: React.ReactNode;
  nombre: string;
  rol: UserRole;
}

export function LayoutShell({ children, nombre, rol }: LayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Open by default on desktop after mount (avoid SSR mismatch)
  useEffect(() => {
    if (window.innerWidth >= 768) setSidebarOpen(true);
  }, []);

  // Close on navigation only on mobile
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar
          nombre={nombre}
          rol={rol}
          title="SistemaGan"
          onMenuClick={() => setSidebarOpen((v) => !v)}
        />
        <main className="flex-1 overflow-auto" style={{ background: "var(--page-bg)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
