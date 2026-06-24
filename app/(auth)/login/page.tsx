"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Store } from "lucide-react";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginAction, { error: "" });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f9]">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#E85D24" }}>
            <Store className="text-white" size={22} />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 leading-tight">SistemaGan</p>
            <p className="text-xs text-gray-400">Facturación electrónica CR</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-base font-semibold text-gray-900 mb-6">Iniciar sesión</h1>

          <form action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue="admin@sistemagan.cr"
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#E85D24] focus:ring-2 focus:ring-[#E85D24]/20 transition-all"
                placeholder="correo@empresa.cr"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <button type="button" className="text-xs text-[#E85D24] hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                defaultValue="admin123"
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#E85D24] focus:ring-2 focus:ring-[#E85D24]/20 transition-all"
                placeholder="••••••••"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="remember"
                defaultChecked
                className="w-4 h-4 rounded accent-[#E85D24]"
              />
              <span className="text-sm text-gray-600">Recordarme</span>
            </label>

            {state?.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="mt-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
              style={{ background: isPending ? "#ccc" : "#E85D24" }}
            >
              {isPending ? "Iniciando sesión…" : "Iniciar sesión"}
            </button>
          </form>
        </div>

        {/* Dev hint */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Modo desarrollo — admin@sistemagan.cr / admin123
        </p>
      </div>
    </div>
  );
}
