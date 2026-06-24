"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Store, Leaf } from "lucide-react";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginAction, { error: "" });

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%)" }}
    >
      {/* Decorative background blobs */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
          transform: "translate(30%, -30%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(5,150,105,0.06) 0%, transparent 70%)",
          transform: "translate(-30%, 30%)",
        }}
      />
      {/* Dot grid */}
      <div className="absolute inset-0 bg-dot-grid opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-sm px-4">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8 animate-fade-in-up">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center animate-float"
            style={{
              background: "linear-gradient(135deg, #059669 0%, #10b981 60%, #34d399 100%)",
              boxShadow: "0 8px 24px rgba(16,185,129,0.35)",
            }}
          >
            <Store className="text-white" size={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 leading-tight">SistemaGan</p>
            <p className="text-xs font-medium" style={{ color: "#059669" }}>
              Facturación electrónica CR
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-2xl p-8 animate-fade-in-up delay-100"
          style={{
            border: "1px solid rgba(16,185,129,0.15)",
            boxShadow: "0 4px 32px rgba(16,185,129,0.08), 0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <h1 className="text-lg font-bold text-gray-900 mb-1">Bienvenido</h1>
          <p className="text-sm text-gray-400 mb-6">Ingresá tus credenciales para continuar.</p>

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
                className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-gray-50/50"
                placeholder="correo@empresa.cr"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <button type="button" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
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
                className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-gray-50/50"
                placeholder="••••••••"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="remember" defaultChecked className="w-4 h-4 rounded accent-emerald-600" />
              <span className="text-sm text-gray-600">Recordarme</span>
            </label>

            {state?.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3.5 py-2.5">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="mt-1 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: isPending
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                boxShadow: isPending ? "none" : "0 4px 14px rgba(16,185,129,0.35)",
              }}
            >
              {isPending ? "Iniciando sesión…" : "Iniciar sesión"}
            </button>
          </form>
        </div>

        {/* Dev hint */}
        <p className="text-center text-xs text-gray-400 mt-5 animate-fade-in delay-300">
          <Leaf size={10} className="inline mr-1 text-emerald-400" />
          Modo desarrollo · admin@sistemagan.cr / admin123
        </p>
      </div>
    </div>
  );
}
