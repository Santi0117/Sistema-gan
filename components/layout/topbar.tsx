"use client";

import { useState } from "react";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";
import { logoutAction } from "@/app/(auth)/login/actions";
import type { UserRole } from "@/lib/session";

interface TopbarProps {
  nombre: string;
  rol: UserRole;
  title: string;
}

const ROL_LABEL: Record<UserRole, string> = {
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  CONTADOR: "Contador",
};

export function Topbar({ nombre, rol, title }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = nombre
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-5 gap-4 shrink-0">
      <span className="flex-1 text-sm font-semibold text-gray-800">{title}</span>

      {/* Notifications */}
      <button className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Notificaciones">
        <Bell size={17} className="text-gray-500" />
      </button>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
            style={{ background: "#E85D24" }}
          >
            {initials}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-medium text-gray-800 leading-tight">{nombre}</p>
            <p className="text-[10px] text-gray-400 leading-tight">{ROL_LABEL[rol]}</p>
          </div>
          <ChevronDown size={13} className="text-gray-400" />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-10 z-20 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-1">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-900">{nombre}</p>
                <p className="text-[10px] text-gray-400">{ROL_LABEL[rol]}</p>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={13} />
                  Cerrar sesión
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
