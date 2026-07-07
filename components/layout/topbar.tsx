"use client";

import { useState, useEffect } from "react";
import { Bell, ChevronDown, LogOut, Sun, Moon } from "lucide-react";
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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sg-theme");
    const dark = saved === "dark";
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("sg-theme", next ? "dark" : "light");
  }

  const initials = nombre
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const headerCls = isDark
    ? "h-12 flex items-center px-5 gap-4 shrink-0 transition-colors bg-[#071310] border-b border-emerald-900/30"
    : "h-12 flex items-center px-5 gap-4 shrink-0 transition-colors bg-white border-b border-gray-200";

  const titleCls = isDark ? "flex-1 text-sm font-semibold text-emerald-100" : "flex-1 text-sm font-semibold text-gray-800";
  const iconBtnCls = isDark ? "p-1.5 rounded-lg hover:bg-emerald-900/40 transition-colors" : "p-1.5 rounded-lg hover:bg-gray-100 transition-colors";
  const userBtnCls = isDark ? "flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-emerald-900/40 transition-colors" : "flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors";
  const dropdownCls = isDark
    ? "absolute right-0 top-10 z-20 w-48 bg-[#0d1f13] rounded-xl border border-emerald-900/30 shadow-lg shadow-black/30 py-1"
    : "absolute right-0 top-10 z-20 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-1";

  return (
    <header className={headerCls}>
      <span className={titleCls}>{title}</span>

      {/* Theme toggle */}
      <button onClick={toggleTheme} className={iconBtnCls} aria-label="Cambiar tema">
        {isDark
          ? <Sun size={17} className="text-amber-400" />
          : <Moon size={17} className="text-gray-500" />
        }
      </button>

      {/* Notifications */}
      <button className={`relative ${iconBtnCls}`} aria-label="Notificaciones">
        <Bell size={17} className={isDark ? "text-emerald-400" : "text-gray-500"} />
      </button>

      {/* User menu */}
      <div className="relative">
        <button onClick={() => setMenuOpen((v) => !v)} className={userBtnCls}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
            style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}
          >
            {initials}
          </div>
          <div className="text-left hidden sm:block">
            <p className={`text-xs font-medium leading-tight ${isDark ? "text-emerald-100" : "text-gray-800"}`}>{nombre}</p>
            <p className={`text-[10px] leading-tight ${isDark ? "text-emerald-600" : "text-gray-400"}`}>{ROL_LABEL[rol]}</p>
          </div>
          <ChevronDown size={13} className={isDark ? "text-emerald-600" : "text-gray-400"} />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className={dropdownCls}>
              <div className={`px-3 py-2 border-b ${isDark ? "border-emerald-900/30" : "border-gray-100"}`}>
                <p className={`text-xs font-medium ${isDark ? "text-emerald-100" : "text-gray-900"}`}>{nombre}</p>
                <p className={`text-[10px] ${isDark ? "text-emerald-600" : "text-gray-400"}`}>{ROL_LABEL[rol]}</p>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 transition-colors ${isDark ? "hover:bg-red-950/40" : "hover:bg-red-50 text-red-600"}`}
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
