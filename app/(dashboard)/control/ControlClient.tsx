"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText, TrendingUp, Package, Users, CreditCard,
  Clock, CheckCircle, ArrowUpRight,
} from "lucide-react";

/* ── Types ───────────────────────────────────────────────────────── */
export interface UltimaFactura {
  id: string;
  tipoComprobante: string;
  fecha: string;
  total: string;
  estado: string;
  estadoMH: string;
  clienteNombre: string;
}

export interface DashboardStats {
  facturasMes: number;
  ventasMes: number;
  pendientesMH: number;
  stockBajo: number;
  totalClientes: number;
  creditosVencidos: number;
  ultimasFacturas: UltimaFactura[];
  saludo: string;
  nombreUsuario: string;
  fechaHoy: string;
}

/* ── Animated counter ────────────────────────────────────────────── */
function useCount(target: number, duration = 1200, delay = 300) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    let t0 = 0;
    const id = setTimeout(() => {
      const tick = (ts: number) => {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / duration, 1);
        setVal(Math.round((1 - (1 - p) ** 3) * target));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(id); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return val;
}

/* ── Sparkline ───────────────────────────────────────────────────── */
function Sparkline({ data }: { data: number[] }) {
  const W = 68, H = 26;
  const mn = Math.min(...data), rng = Math.max(...data) - mn || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - mn) / rng) * (H - 4) - 2,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={W} height={H} className="shrink-0">
      <defs>
        <linearGradient id="spkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${W},${H} L0,${H} Z`} fill="url(#spkFill)" />
      <path d={line} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="2.5" fill="#10b981" />
    </svg>
  );
}

/* ── Bar chart ───────────────────────────────────────────────────── */
const WEEKLY = [
  { label: "Sem 1", value: 8200,  sub: "1–7 jun" },
  { label: "Sem 2", value: 12500, sub: "8–14 jun" },
  { label: "Sem 3", value: 9800,  sub: "15–21 jun" },
  { label: "Sem 4", value: 3746,  sub: "22–25 jun", current: true },
];
const SPARKLINE_DATA = [800, 3200, 1400, 6800, 4100, 8500, 3746];
const MAX_W = Math.max(...WEEKLY.map(w => w.value));

function BarChart({ mounted }: { mounted: boolean }) {
  const LM = 36; // left margin for Y-axis labels
  const CW = 320, CH = 130, BW = 42;
  const slot = CW / WEEKLY.length;

  return (
    <svg width="100%" viewBox={`0 0 ${CW + LM} ${CH + 38}`}>
      <defs>
        <linearGradient id="bG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="bGc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.65" />
        </linearGradient>
        <filter id="bGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="bl" />
          <feFlood floodColor="#10b981" floodOpacity="0.4" result="cl" />
          <feComposite in="cl" in2="bl" operator="in" result="gl" />
          <feMerge><feMergeNode in="gl" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Everything offset by LM to make room for Y labels */}
      <g transform={`translate(${LM}, 0)`}>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(p => (
        <line key={p} x1={0} y1={CH - p * CH} x2={CW} y2={CH - p * CH}
          stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" strokeDasharray="3,4" />
      ))}
      {/* Y labels */}
      {[0.5, 1].map(p => (
        <text key={p} x={-4} y={CH - p * CH + 3.5}
          textAnchor="end" fontSize="8" fill="currentColor" opacity="0.35">
          ₡{((p * MAX_W) / 1000).toFixed(0)}k
        </text>
      ))}

      {WEEKLY.map(({ label, value, sub, current }, i) => {
        const bH = mounted ? (value / MAX_W) * CH : 0;
        const x = i * slot + (slot - BW) / 2;
        const y = CH - bH;
        const dur = `${0.75 + i * 0.04}s`;
        const del = `${i * 90}ms`;
        const ease = "cubic-bezier(.34,1.4,.64,1)";
        return (
          <g key={label}>
            {/* Shadow */}
            <rect x={x + 3} y={y + 3} width={BW} height={bH} rx={7}
              fill={current ? "#34d399" : "#10b981"} opacity="0.12"
              style={{ transition: `y ${dur} ${ease} ${del}, height ${dur} ${ease} ${del}` }}
            />
            {/* Bar */}
            <rect x={x} y={y} width={BW} height={bH} rx={7}
              fill={current ? "url(#bGc)" : "url(#bG)"}
              filter={current ? "url(#bGlow)" : undefined}
              style={{ transition: `y ${dur} ${ease} ${del}, height ${dur} ${ease} ${del}` }}
            />
            {/* Value label */}
            <text x={x + BW / 2} y={y - 7} textAnchor="middle" fontSize="9" fontWeight="700"
              fill={current ? "#34d399" : "#10b981"}
              opacity={mounted ? 1 : 0}
              style={{ transition: `opacity 0.4s ${parseInt(del) + 550}ms` }}>
              ₡{(value / 1000).toFixed(1)}k
            </text>
            {/* X labels */}
            <text x={x + BW / 2} y={CH + 15} textAnchor="middle" fontSize="9"
              fontWeight={current ? "600" : "400"} fill="currentColor" opacity={current ? 0.75 : 0.45}>
              {label}
            </text>
            <text x={x + BW / 2} y={CH + 27} textAnchor="middle" fontSize="7.5"
              fill="currentColor" opacity="0.3">
              {sub}
            </text>
            {current && (
              <circle cx={x + BW / 2} cy={CH + 34} r="2.5" fill="#34d399" opacity="0.85" />
            )}
          </g>
        );
      })}
      </g>{/* end translate group */}
    </svg>
  );
}

/* ── Donut chart ─────────────────────────────────────────────────── */
function DonutChart({ aceptadas, pendientes, otros, mounted }: {
  aceptadas: number; pendientes: number; otros: number; mounted: boolean;
}) {
  const total = aceptadas + pendientes + otros || 1;
  const R = 44, CX = 58, CY = 58, C = 2 * Math.PI * R;

  const segs = [
    { pct: aceptadas / total, color: "#10b981", label: "Aceptadas", n: aceptadas },
    { pct: pendientes / total, color: "#f59e0b", label: "Pendientes", n: pendientes },
    { pct: otros / total, color: "#94a3b8", label: "N/A", n: otros },
  ];

  let cumAngle = -90;
  return (
    <div className="flex items-center gap-5">
      <svg width="116" height="116" viewBox="0 0 116 116" className="shrink-0">
        <circle cx={CX} cy={CY} r={R} fill="none"
          stroke="currentColor" strokeOpacity="0.08" strokeWidth="15" />
        {segs.map((seg, i) => {
          const dash = mounted ? seg.pct * C : 0;
          const rot = cumAngle;
          cumAngle += seg.pct * 360;
          return (
            <circle key={i} cx={CX} cy={CY} r={R}
              fill="none" stroke={seg.color}
              strokeWidth={i === 0 ? 15 : 12}
              strokeDasharray={`${dash} ${C - dash}`}
              strokeLinecap="round"
              transform={`rotate(${rot} ${CX} ${CY})`}
              style={{
                transition: mounted
                  ? `stroke-dasharray 0.9s cubic-bezier(.34,1.1,.64,1) ${i * 160 + 200}ms`
                  : "none",
              }}
            />
          );
        })}
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="22" fontWeight="800" fill="currentColor">{total}</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.4">facturas</text>
      </svg>

      <div className="space-y-2.5 flex-1">
        {segs.map((seg, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: seg.color }} />
                <span className="text-xs text-gray-500">{seg.label}</span>
              </div>
              <span className="text-xs font-bold" style={{ color: seg.color }}>{seg.n}</span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full"
                style={{
                  width: mounted ? `${seg.pct * 100}%` : "0%",
                  background: seg.color,
                  transition: `width 0.8s cubic-bezier(.34,1.1,.64,1) ${i * 120 + 300}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Estado MH config ────────────────────────────────────────────── */
const MH_CFG: Record<string, { label: string; bg: string; color: string }> = {
  NO_APLICA:  { label: "N/A",        bg: "#f3f4f6", color: "#6b7280" },
  PENDIENTE:  { label: "Pendiente",  bg: "#fef3c7", color: "#d97706" },
  EN_PROCESO: { label: "En proceso", bg: "#dbeafe", color: "#2563eb" },
  ACEPTADA:   { label: "Aceptada",   bg: "#d1fae5", color: "#059669" },
  RECHAZADA:  { label: "Rechazada",  bg: "#fee2e2", color: "#dc2626" },
  ERROR:      { label: "Error",      bg: "#fee2e2", color: "#dc2626" },
};

const TIPO: Record<string, string> = {
  FE: "Fact. Elect.", TE: "Tiquete", ND: "Nota Déb.", NC: "Nota Cré.",
  FEC: "F. Compra", REP: "Recibo", NORMAL: "Fact. Local",
};

/* ── Main component ──────────────────────────────────────────────── */
export function ControlDashboard({ stats }: { stats: DashboardStats }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const cFacturas  = useCount(stats.facturasMes, 800, 350);
  const cVentas    = useCount(stats.ventasMes, 1400, 400);
  const cClientes  = useCount(stats.totalClientes, 700, 500);
  const cCreditos  = useCount(stats.creditosVencidos, 600, 550);

  const aceptadas  = stats.ultimasFacturas.filter(f => f.estadoMH === "ACEPTADA").length;
  const pendientes = stats.ultimasFacturas.filter(f => f.estadoMH === "PENDIENTE" || f.estadoMH === "EN_PROCESO").length;
  const otros      = stats.ultimasFacturas.length - aceptadas - pendientes;

  const metaPct = Math.min((stats.ventasMes / 50000) * 100, 100);

  return (
    <div className="p-3 sm:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-5">

      {/* ── Greeting banner ── */}
      <div className="animate-fade-in-up relative rounded-2xl px-6 py-5 overflow-hidden"
        style={{
          isolation: "isolate",
          background: "linear-gradient(135deg, #0e2016 0%, #0a1a10 55%, #071310 100%)",
          boxShadow: "0 4px 32px rgba(16,185,129,0.18), 0 2px 10px rgba(0,0,0,0.25)",
        }}>
        <div className="absolute right-0 top-0 w-60 h-60 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)", transform: "translate(28%,-32%)" }} />
        <div className="absolute bottom-0 left-1/3 w-44 h-44 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)" }} />

        <p className="text-xs text-emerald-400/60 font-medium mb-0.5">{stats.fechaHoy}</p>
        <h1 className="text-2xl font-bold text-white">
          {stats.saludo},{" "}
          <span className="text-gradient-emerald">{stats.nombreUsuario}</span> 👋
        </h1>
        <p className="text-sm text-white/40 mt-1">
          {stats.facturasMes} factura{stats.facturasMes !== 1 ? "s" : ""} emitida{stats.facturasMes !== 1 ? "s" : ""} este mes
          {" · "}₡{stats.ventasMes.toLocaleString("es-CR")} en ventas
        </p>

        {/* Meta progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full"
              style={{
                width: mounted ? `${metaPct}%` : "0%",
                background: "linear-gradient(90deg, #059669, #34d399)",
                transition: "width 1.6s cubic-bezier(.34,1.05,.64,1) 500ms",
              }} />
          </div>
          <span className="text-xs text-white/35 shrink-0">
            {Math.round(metaPct)}% de meta mensual
          </span>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Facturas del mes */}
        <Link href="/ventas"
          className="animate-fade-in-up card-hover-glow bg-white border border-gray-100 rounded-2xl p-4 block group"
          style={{ animationDelay: "60ms" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 font-medium">Facturas del mes</p>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
              <FileText size={14} className="text-emerald-600" />
            </div>
          </div>
          <p className="font-bold text-3xl text-emerald-500">{cFacturas}</p>
          <div className="mt-2 flex items-center gap-1">
            <TrendingUp size={10} className="text-emerald-400" />
            <span className="text-[10px] text-emerald-500 font-medium">este mes</span>
          </div>
        </Link>

        {/* Ventas del mes */}
        <Link href="/reportes/ventas-mensual"
          className="animate-fade-in-up card-hover-glow bg-white border border-gray-100 rounded-2xl p-4 block group"
          style={{ animationDelay: "110ms" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 font-medium">Ventas del mes</p>
            <Sparkline data={SPARKLINE_DATA} />
          </div>
          <p className="font-bold text-xl text-gradient-money">
            ₡{cVentas.toLocaleString("es-CR")}
          </p>
          <div className="mt-1 flex items-center gap-1">
            <TrendingUp size={10} className="text-emerald-400" />
            <span className="text-[10px] text-emerald-500 font-medium">mes en curso</span>
          </div>
        </Link>

        {/* Pendientes MH */}
        <Link href="/ventas"
          className="animate-fade-in-up card-hover-glow bg-white border border-gray-100 rounded-2xl p-4 block group"
          style={{ animationDelay: "160ms" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 font-medium">Pendientes MH</p>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${stats.pendientesMH > 0 ? "bg-amber-50" : "bg-gray-50"}`}>
              <Clock size={14} className={stats.pendientesMH > 0 ? "text-amber-500" : "text-gray-400"} />
            </div>
          </div>
          <p className="font-bold text-3xl" style={{ color: stats.pendientesMH > 0 ? "#d97706" : "#9ca3af" }}>
            {stats.pendientesMH}
          </p>
          {stats.pendientesMH > 0 && (
            <span className="mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">
              Requiere acción
            </span>
          )}
        </Link>

        {/* Stock bajo */}
        <Link href="/inventario"
          className="animate-fade-in-up card-hover-glow bg-white border border-gray-100 rounded-2xl p-4 block group"
          style={{ animationDelay: "210ms" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 font-medium">Stock bajo</p>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${stats.stockBajo > 0 ? "bg-red-50" : "bg-gray-50"}`}>
              <Package size={14} className={stats.stockBajo > 0 ? "text-red-400" : "text-gray-400"} />
            </div>
          </div>
          <p className="font-bold text-3xl" style={{ color: stats.stockBajo > 0 ? "#ef4444" : "#9ca3af" }}>
            {stats.stockBajo}
          </p>
          {stats.stockBajo > 0 && (
            <span className="mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600">
              {stats.stockBajo} producto{stats.stockBajo !== 1 ? "s" : ""}
            </span>
          )}
        </Link>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 sm:gap-4 animate-fade-in-up" style={{ animationDelay: "260ms" }}>

        {/* Bar chart — ventas semanales */}
        <div className="md:col-span-3 bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Ventas semanales</h3>
              <p className="text-xs text-gray-400 mt-0.5">Junio 2026 · mes en curso</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-600 font-medium">En curso</span>
            </div>
          </div>
          <BarChart mounted={mounted} />
        </div>

        {/* Donut — estado comprobantes */}
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Comprobantes</h3>
            <p className="text-xs text-gray-400 mt-0.5">Estado Hacienda</p>
          </div>
          <DonutChart
            aceptadas={aceptadas}
            pendientes={pendientes}
            otros={otros}
            mounted={mounted}
          />
        </div>
      </div>

      {/* ── Secondary KPIs ── */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 animate-fade-in-up" style={{ animationDelay: "320ms" }}>
        <Link href="/clientes"
          className="card-hover-glow bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110">
            <Users size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{cClientes}</p>
            <p className="text-xs text-gray-400">Clientes activos</p>
          </div>
        </Link>
        <Link href="/reportes/creditos"
          className="card-hover-glow bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110">
            <CreditCard size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{cCreditos}</p>
            <p className="text-xs text-gray-400">Créditos pendientes</p>
          </div>
        </Link>
      </div>

      {/* ── Alertas ── */}
      <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "380ms" }}>
        {stats.pendientesMH === 0 && stats.stockBajo === 0 && stats.creditosVencidos === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="text-sm text-emerald-800 font-medium">Todo en orden — sin alertas pendientes.</span>
          </div>
        ) : (
          <>
            {stats.pendientesMH > 0 && (
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3 relative overflow-hidden animate-slide-in-left"
                style={{ background: "#fff7ed", border: "1px solid #fed7aa", animationDelay: "400ms" }}>
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: "#f97316" }} />
                <Clock className="h-4 w-4 shrink-0 ml-1 text-orange-500" />
                <span className="text-sm flex-1 font-medium text-orange-700">
                  {stats.pendientesMH} comprobante{stats.pendientesMH !== 1 ? "s" : ""} pendiente{stats.pendientesMH !== 1 ? "s" : ""} de envío a Hacienda.
                </span>
                <Link href="/ventas" className="text-xs font-semibold shrink-0 text-orange-700 flex items-center gap-0.5">
                  Ver comprobantes <ArrowUpRight size={11} />
                </Link>
              </div>
            )}
            {stats.stockBajo > 0 && (
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3 relative overflow-hidden animate-slide-in-left"
                style={{ background: "#fef2f2", border: "1px solid #fecaca", animationDelay: "450ms" }}>
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: "#ef4444" }} />
                <Package className="h-4 w-4 shrink-0 ml-1 text-red-500" />
                <span className="text-sm flex-1 font-medium text-red-700">
                  {stats.stockBajo} producto{stats.stockBajo !== 1 ? "s" : ""} con stock bajo o agotado.
                </span>
                <Link href="/inventario" className="text-xs font-semibold shrink-0 text-red-700 flex items-center gap-0.5">
                  Ver inventario <ArrowUpRight size={11} />
                </Link>
              </div>
            )}
            {stats.creditosVencidos > 0 && (
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3 relative overflow-hidden animate-slide-in-left"
                style={{ background: "#fefce8", border: "1px solid #fde68a", animationDelay: "500ms" }}>
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: "#eab308" }} />
                <CreditCard className="h-4 w-4 shrink-0 ml-1 text-yellow-500" />
                <span className="text-sm flex-1 font-medium text-yellow-700">
                  {stats.creditosVencidos} factura{stats.creditosVencidos !== 1 ? "s" : ""} a crédito pendiente{stats.creditosVencidos !== 1 ? "s" : ""} de cobro.
                </span>
                <Link href="/reportes/creditos" className="text-xs font-semibold shrink-0 text-yellow-700 flex items-center gap-0.5">
                  Ver créditos <ArrowUpRight size={11} />
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Últimas facturas ── */}
      <div className="animate-fade-in-up rounded-2xl overflow-hidden"
        style={{ animationDelay: "460ms", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-4 rounded-full"
              style={{ background: "linear-gradient(to bottom, #10b981, #34d399)" }} />
            <h2 className="text-sm font-semibold text-gray-800">Últimos comprobantes</h2>
          </div>
          <Link href="/ventas" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-0.5">
            Ver todos <ArrowUpRight size={11} />
          </Link>
        </div>
        <div className="divide-y divide-gray-50/80 bg-white">
          {stats.ultimasFacturas.map((f, idx) => {
            const cfg = MH_CFG[f.estadoMH] ?? MH_CFG.NO_APLICA;
            return (
              <Link key={f.id} href={`/ventas/${f.id}`}
                className="animate-slide-in-left flex items-center gap-3 px-5 py-3.5 hover:bg-emerald-50/30 transition-colors group"
                style={{ animationDelay: `${500 + idx * 50}ms` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)" }}>
                  <FileText className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate group-hover:text-emerald-700 transition-colors">
                    {f.clienteNombre}
                  </p>
                  <p className="text-xs text-gray-400">
                    {TIPO[f.tipoComprobante] ?? f.tipoComprobante}
                    {" · "}
                    {new Date(f.fecha).toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit" })}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-gray-800">
                    ₡{Math.round(parseFloat(f.total)).toLocaleString("es-CR")}
                  </p>
                  <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
              </Link>
            );
          })}
          {stats.ultimasFacturas.length === 0 && (
            <div className="py-12 text-center bg-white">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="text-sm text-gray-400">Sin facturas aún.</p>
              <Link href="/ventas/nueva" className="text-sm text-emerald-600 font-medium mt-1 block">
                Emitir la primera factura →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Acciones rápidas ── */}
      <div className="animate-fade-in-up" style={{ animationDelay: "580ms" }}>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { href: "/ventas/nueva",             label: "Nueva factura",  emoji: "🧾", delay: "600ms" },
            { href: "/clientes/nuevo",            label: "Nuevo cliente",  emoji: "👤", delay: "640ms" },
            { href: "/productos/nuevo",           label: "Nuevo producto", emoji: "📦", delay: "680ms" },
            { href: "/reportes/impuestos-ventas", label: "D-150 IVA",      emoji: "📑", delay: "720ms" },
          ].map(({ href, label, emoji, delay }) => (
            <Link key={href} href={href}
              className="animate-scale-in card-hover-glow bg-white border border-gray-100 rounded-2xl p-4 text-center group"
              style={{ animationDelay: delay }}>
              <div className="text-2xl mb-2 transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-3 inline-block">
                {emoji}
              </div>
              <p className="text-xs text-gray-600 font-medium group-hover:text-emerald-600 transition-colors">{label}</p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
