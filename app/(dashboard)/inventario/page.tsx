"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package, AlertTriangle, Droplets, ChefHat,
  TrendingDown, BarChart2, ArrowRight, Award, Activity,
} from "lucide-react";
import { Decimal } from "decimal.js";

// ── Mock data ──────────────────────────────────────────────────────────────────

interface Producto {
  id: string; codigo: string; nombre: string; categoria: string;
  stockActual: string; stockMinimo: string; precioVenta: string;
  precioCosto: string; controlarStock: boolean; unidadMedida: string; activo: boolean;
}

const MOCK_PRODUCTOS: Producto[] = [
  { id:"p1", codigo:"LECH001", nombre:"Leche entera 1L", categoria:"Lácteos",
    stockActual:"145", stockMinimo:"50", precioVenta:"950", precioCosto:"700",
    controlarStock:true, unidadMedida:"Unid", activo:true },
  { id:"p2", codigo:"QUES001", nombre:"Queso Turrialba 500g", categoria:"Quesos",
    stockActual:"38", stockMinimo:"20", precioVenta:"4200", precioCosto:"2800",
    controlarStock:true, unidadMedida:"Unid", activo:true },
  { id:"p3", codigo:"QUES002", nombre:"Queso Palmito 250g", categoria:"Quesos",
    stockActual:"22", stockMinimo:"15", precioVenta:"3100", precioCosto:"2100",
    controlarStock:true, unidadMedida:"Unid", activo:true },
  { id:"p4", codigo:"CREM001", nombre:"Crema de leche 500mL", categoria:"Lácteos",
    stockActual:"67", stockMinimo:"30", precioVenta:"1850", precioCosto:"1300",
    controlarStock:true, unidadMedida:"Unid", activo:true },
  { id:"p5", codigo:"MANT001", nombre:"Mantequilla 250g", categoria:"Lácteos",
    stockActual:"12", stockMinimo:"20", precioVenta:"2300", precioCosto:"1600",
    controlarStock:true, unidadMedida:"Unid", activo:true },
  { id:"p6", codigo:"YOQU001", nombre:"Yogurt natural 1L", categoria:"Lácteos",
    stockActual:"55", stockMinimo:"25", precioVenta:"1750", precioCosto:"1200",
    controlarStock:true, unidadMedida:"Unid", activo:true },
  { id:"p7", codigo:"VITA001", nombre:"Vitaminas bovinas 500mL", categoria:"Veterinario",
    stockActual:"8", stockMinimo:"5", precioVenta:"18500", precioCosto:"14000",
    controlarStock:true, unidadMedida:"Unid", activo:true },
  { id:"p8", codigo:"BALA001", nombre:"Balanceado bovino 50Kg", categoria:"Alimentación",
    stockActual:"3", stockMinimo:"10", precioVenta:"28000", precioCosto:"22000",
    controlarStock:true, unidadMedida:"Saco", activo:true },
];

const LECHE_DATA = {
  metaMensual: 10000,
  recibitoMes: 6847,
  tabla: [
    { fecha: "25/06", proveedor: "Finca Los Robles", litros: 285, grasa: 3.8, proteina: 3.2 },
    { fecha: "24/06", proveedor: "Finca El Paraíso", litros: 320, grasa: 3.9, proteina: 3.3 },
    { fecha: "23/06", proveedor: "Finca Los Robles", litros: 298, grasa: 3.7, proteina: 3.1 },
    { fecha: "22/06", proveedor: "Finca Santa Ana", litros: 275, grasa: 4.1, proteina: 3.4 },
    { fecha: "21/06", proveedor: "Finca Los Robles", litros: 312, grasa: 3.8, proteina: 3.2 },
  ],
};

const QUESOS_DATA = [
  { nombre: "Turrialba", meta: 200, producido: 178, color: "#f59e0b", colorBg: "#fef9ee" },
  { nombre: "Palmito",   meta: 60,  producido: 47,  color: "#10b981", colorBg: "#f0fdf4" },
  { nombre: "Mozarella", meta: 40,  producido: 31,  color: "#6366f1", colorBg: "#f0f0ff" },
  { nombre: "Crema",     meta: 150, producido: 143, color: "#ec4899", colorBg: "#fff0f8" },
];

const MERMA_DATA = [
  { producto: "Leche cruda",     unidad: "L",  cantidad: 142.8, pct: 2.1, objetivo: 3.0, estado: "ok"     as const },
  { producto: "Queso Turrialba", unidad: "kg", cantidad: 3.4,   pct: 1.9, objetivo: 2.0, estado: "ok"     as const },
  { producto: "Queso Palmito",   unidad: "kg", cantidad: 1.2,   pct: 2.5, objetivo: 2.0, estado: "alerta" as const },
  { producto: "Crema de leche",  unidad: "kg", cantidad: 2.8,   pct: 1.4, objetivo: 2.0, estado: "ok"     as const },
  { producto: "Mantequilla",     unidad: "kg", cantidad: 0.9,   pct: 3.8, objetivo: 3.0, estado: "alto"   as const },
];

const RENDIMIENTOS_DATA = [
  { queso: "Turrialba", litrosPorKg: 8.4, estandar: 8.5, lote: "L-2026-06-24", litros: 1495, kg: 178 },
  { queso: "Palmito",   litrosPorKg: 7.1, estandar: 7.5, lote: "L-2026-06-23", litros: 334,  kg: 47  },
  { queso: "Mozarella", litrosPorKg: 10.2, estandar: 10.0, lote: "L-2026-06-22", litros: 316, kg: 31 },
  { queso: "Crema",     litrosPorKg: 4.8, estandar: 5.0, lote: "L-2026-06-22", litros: 686,  kg: 143 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCRC(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return `₡${n.toLocaleString("es-CR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ── Milk Tank ─────────────────────────────────────────────────────────────────

function MilkTank({ litros, meta }: { litros: number; meta: number }) {
  const pct = Math.min(100, Math.round((litros / meta) * 100));
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setFill(pct), 300);
    return () => clearTimeout(t);
  }, [pct]);

  const isLow = pct < 40;
  const liquidColor = isLow
    ? "linear-gradient(to top, #92400e 0%, #f59e0b 65%, #fde68a 100%)"
    : "linear-gradient(to top, #065f46 0%, #10b981 60%, #a7f3d0 100%)";
  const waveColor = isLow ? "#f59e0b" : "#10b981";
  const textOnLiquid = fill > 45;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      {/* Tank */}
      <div className="relative flex-shrink-0 flex flex-col items-center">
        {/* Scale */}
        <div className="absolute left-full ml-2 top-6 h-[208px] flex flex-col justify-between pointer-events-none">
          {[100, 75, 50, 25, 0].map((v) => (
            <div key={v} className="flex items-center gap-1">
              <div className="w-2 h-px bg-gray-300" />
              <span className="text-[9px] text-gray-400 font-mono">{v}%</span>
            </div>
          ))}
        </div>

        {/* Cap */}
        <div className="w-20 h-4 rounded-t-full z-10 border-4 border-b-0 border-emerald-400 bg-emerald-100" />

        {/* Tank body */}
        <div
          className="relative w-40 h-52 rounded-b-2xl rounded-t-sm border-4 overflow-hidden"
          style={{ borderColor: "#10b981", background: "#f0fdf4" }}
        >
          {/* Liquid fill */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: `${fill}%`,
              background: liquidColor,
              transition: "height 2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* Wave */}
            <div className="absolute -top-3 left-0 right-0 h-6 overflow-hidden">
              <svg
                viewBox="0 0 400 24"
                preserveAspectRatio="none"
                className="animate-wave-move"
                style={{ width: "200%", height: "24px" }}
              >
                {/* seamless loop: x=0 and x=200 both at y=12 */}
                <path
                  d="M0,12 C50,2 150,22 200,12 C250,2 350,22 400,12 L400,24 L0,24 Z"
                  fill={waveColor}
                  opacity="0.85"
                />
              </svg>
            </div>

            {/* Bubbles */}
            {[
              { left: "22%", bottom: "15%", size: 10, delay: "0s" },
              { left: "58%", bottom: "35%", size: 7,  delay: "1.2s" },
              { left: "40%", bottom: "55%", size: 8,  delay: "2.5s" },
            ].map((b, i) => (
              <div
                key={i}
                className="absolute rounded-full opacity-25"
                style={{
                  left: b.left,
                  bottom: b.bottom,
                  width: b.size,
                  height: b.size,
                  background: "white",
                  animation: `bubble-rise ${3 + i * 0.8}s ease-in ${b.delay} infinite`,
                }}
              />
            ))}
          </div>

          {/* Percentage overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
            <span
              className="text-5xl font-black leading-none transition-colors duration-500"
              style={{ color: textOnLiquid ? "white" : "#065f46", textShadow: textOnLiquid ? "0 2px 8px rgba(0,0,0,0.25)" : "none" }}
            >
              {fill}%
            </span>
            <span className="text-xs font-semibold mt-1 transition-colors duration-500"
              style={{ color: textOnLiquid ? "rgba(255,255,255,0.8)" : "#059669" }}>
              {litros.toLocaleString("es-CR")} L
            </span>
          </div>

          {/* Measurement lines */}
          {[25, 50, 75].map((v) => (
            <div key={v} className="absolute left-0 right-0 h-px bg-emerald-200 opacity-60"
              style={{ bottom: `${v}%` }} />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2 font-medium">Meta: {meta.toLocaleString("es-CR")} L / mes</p>
      </div>

      {/* Stats */}
      <div className="flex-1 w-full space-y-3">
        {[
          { label: "Recibido este mes", value: `${litros.toLocaleString("es-CR")} L`, accent: true },
          { label: "Meta mensual",       value: `${meta.toLocaleString("es-CR")} L` },
          { label: "Recibido ayer",      value: "320 L" },
          { label: "Recibido hoy",       value: "285 L" },
          { label: "Proveedores activos",value: "3" },
        ].map((s) => (
          <div key={s.label} className="flex justify-between items-center pb-2 border-b border-gray-100">
            <span className="text-xs text-gray-500">{s.label}</span>
            <span className={`text-sm font-bold ${s.accent ? "text-emerald-600" : "text-gray-800"}`}>{s.value}</span>
          </div>
        ))}

        {/* Progress bar */}
        <div className="pt-1">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Progreso del mes</span>
            <span className="font-semibold text-emerald-600">{pct}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-[2s] ease-out"
              style={{ width: `${fill}%`, background: "linear-gradient(to right, #065f46, #10b981, #6ee7b7)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Cheese Wheel ──────────────────────────────────────────────────────────────

function CheeseWheel({
  nombre, producido, meta, color, colorBg, delay = 0,
}: { nombre: string; producido: number; meta: number; color: string; colorBg: string; delay?: number }) {
  const pct = Math.min(100, Math.round((producido / meta) * 100));
  const r = 40;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const t = setTimeout(() => setOffset(circ * (1 - pct / 100)), delay + 200);
    return () => clearTimeout(t);
  }, [pct, circ, delay]);

  return (
    <div
      className="flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all hover:-translate-y-1 card-hover-glow"
      style={{ borderColor: `${color}40`, background: colorBg }}
    >
      <div className="relative">
        <svg width="110" height="110" viewBox="0 0 100 100">
          {/* Track */}
          <circle cx="50" cy="50" r={r} fill="none" stroke={`${color}20`} strokeWidth="13" />
          {/* Cheese interior pattern */}
          <circle cx="50" cy="50" r="25" fill={`${color}18`} />
          {[{cx:38,cy:42,r:3},{cx:58,cy:38,r:2},{cx:45,cy:58,r:2.5},{cx:62,cy:55,r:1.8},{cx:52,cy:47,r:1.5}].map((c,i) => (
            <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={`${color}35`} />
          ))}
          {/* Progress arc */}
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={color}
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
            style={{ transition: `stroke-dashoffset 1.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms` }}
          />
          {/* Text */}
          <text x="50" y="47" textAnchor="middle" fontSize="18" fontWeight="900" fill="#1f2937">{pct}%</text>
          <text x="50" y="61" textAnchor="middle" fontSize="9" fill="#6b7280">{producido} kg</text>
        </svg>
        {pct >= 90 && (
          <div className="absolute inset-0 rounded-full pointer-events-none animate-glow-pulse"
            style={{ boxShadow: `0 0 18px ${color}55` }} />
        )}
      </div>
      <div className="text-center">
        <p className="font-bold text-gray-800 text-sm">{nombre}</p>
        <p className="text-xs text-gray-400">Meta: {meta} kg</p>
        <p className="text-xs font-semibold mt-0.5" style={{ color }}>
          {producido >= meta ? "✓ Completado" : `Faltan ${meta - producido} kg`}
        </p>
      </div>
    </div>
  );
}

// ── Merma Gauge ───────────────────────────────────────────────────────────────

function MermaGauge({ pct, objetivo }: { pct: number; objetivo: number }) {
  const isOk = pct <= objetivo;
  const isAlerta = pct > objetivo && pct < objetivo * 1.35;
  const color = isOk ? "#10b981" : isAlerta ? "#f59e0b" : "#ef4444";
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(Math.min(100, (pct / (objetivo * 2)) * 100)), 250);
    return () => clearTimeout(t);
  }, [pct, objetivo]);

  return (
    <div className="space-y-1.5">
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-[1.5s] ease-out"
          style={{ width: `${w}%`, background: color }}
        />
        {/* Objective line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400 opacity-50"
          style={{ left: "50%" }}
        />
      </div>
      <div className="flex justify-between text-[10px]">
        <span className="font-semibold" style={{ color }}>Actual: {pct}%</span>
        <span className="text-gray-400">Objetivo: ≤{objetivo}%</span>
      </div>
    </div>
  );
}

// ── Yield Bar ─────────────────────────────────────────────────────────────────

function YieldBar({
  queso, litrosPorKg, estandar, lote, litros, kg, delay = 0,
}: { queso: string; litrosPorKg: number; estandar: number; lote: string; litros: number; kg: number; delay?: number }) {
  const max = estandar * 1.6;
  const pct = Math.min(100, (litrosPorKg / max) * 100);
  const stdPct = (estandar / max) * 100;
  const isGood = litrosPorKg <= estandar * 1.05;
  const diff = (((litrosPorKg - estandar) / estandar) * 100).toFixed(1);
  const [barW, setBarW] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBarW(pct), delay + 200);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="animate-slide-in-left" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex justify-between items-end mb-1.5">
        <div>
          <span className="font-semibold text-gray-800">{queso}</span>
          <span className="text-[10px] text-gray-400 ml-2 font-mono">{lote}</span>
        </div>
        <div className="text-right">
          <span className={`text-sm font-bold ${isGood ? "text-emerald-600" : "text-amber-600"}`}>
            {litrosPorKg} L/kg
          </span>
          <span className="text-[10px] text-gray-400 ml-1.5">
            ({parseFloat(diff) >= 0 ? "+" : ""}{diff}% vs estándar)
          </span>
          <div className="text-[10px] text-gray-400">{litros.toLocaleString("es-CR")}L → {kg}kg</div>
        </div>
      </div>
      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-[1.6s] ease-out"
          style={{
            width: `${barW}%`,
            background: isGood
              ? "linear-gradient(to right, #065f46, #10b981, #6ee7b7)"
              : "linear-gradient(to right, #92400e, #f59e0b)",
          }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400 opacity-60"
          style={{ left: `${stdPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
        <span>0 L/kg</span>
        <span>Estándar: {estandar} L/kg ↑</span>
        <span>{max.toFixed(0)} L/kg</span>
      </div>
    </div>
  );
}

// ── Tabs config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "general"       as const, label: "General",       icon: Package     },
  { id: "leche"         as const, label: "Leche Cruda",   icon: Droplets    },
  { id: "quesos"        as const, label: "Quesos",        icon: ChefHat     },
  { id: "merma"         as const, label: "Merma",         icon: TrendingDown },
  { id: "rendimientos"  as const, label: "Rendimientos",  icon: BarChart2   },
];
type TabId = typeof TABS[number]["id"];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InventarioPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  const productos = MOCK_PRODUCTOS;
  const activos = productos.filter((p) => p.activo);
  const stockBajo = activos.filter(
    (p) => p.controlarStock && new Decimal(p.stockActual).lt(new Decimal(p.stockMinimo))
  );
  const valorCosto = activos
    .filter((p) => p.controlarStock)
    .reduce((acc, p) => acc.plus(new Decimal(p.precioCosto).mul(new Decimal(p.stockActual))), new Decimal(0));
  const valorVenta = activos
    .filter((p) => p.controlarStock)
    .reduce((acc, p) => acc.plus(new Decimal(p.precioVenta).mul(new Decimal(p.stockActual))), new Decimal(0));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-500 mt-1">Stock, producción láctea, mermas y rendimientos</p>
        </div>
        <Link
          href="/inventario/movimientos"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all hover:shadow-lg hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" }}
        >
          <ArrowRight className="h-4 w-4" />
          Movimientos
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-gray-200 overflow-x-auto animate-fade-in">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
              activeTab === id
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: General ── */}
      {activeTab === "general" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Productos activos", value: String(activos.length), color: "text-gray-900" },
              { label: "Valor costo",       value: fmtCRC(valorCosto.toFixed(0)), color: "text-gray-900" },
              { label: "Valor venta",       value: fmtCRC(valorVenta.toFixed(0)), color: "text-emerald-600" },
              { label: "Alertas stock",     value: String(stockBajo.length),      color: stockBajo.length > 0 ? "text-red-600" : "text-green-600" },
            ].map((c, i) => (
              <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-5 card-hover-glow animate-scale-in"
                style={{ animationDelay: `${i * 60}ms` }}>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{c.label}</p>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {stockBajo.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-slide-in-left">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h2 className="font-semibold text-red-700">{stockBajo.length} producto{stockBajo.length !== 1 ? "s" : ""} con stock bajo</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {stockBajo.map((p) => (
                  <Link key={p.id} href={`/productos/${p.id}`}
                    className="flex justify-between bg-white border border-red-200 rounded-lg px-3 py-2 text-sm hover:border-red-400 transition-colors">
                    <div>
                      <p className="font-medium text-gray-800">{p.nombre}</p>
                      <p className="text-xs text-gray-500">{p.codigo}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{p.stockActual}</p>
                      <p className="text-xs text-gray-400">mín. {p.stockMinimo}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-500" />
              <h2 className="font-semibold text-gray-800">Stock por producto</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Código</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Producto</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Categoría</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Stock</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Mínimo</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">P. Venta</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activos.map((p) => {
                    const stock = new Decimal(p.stockActual);
                    const minimo = new Decimal(p.stockMinimo);
                    const bajo = p.controlarStock && stock.lt(minimo);
                    const sinStk = p.controlarStock && stock.lte(0);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.codigo}</td>
                        <td className="px-4 py-3">
                          <Link href={`/productos/${p.id}`} className="font-medium text-gray-800 hover:text-emerald-600">{p.nombre}</Link>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{p.categoria}</td>
                        <td className={`px-4 py-3 text-right font-bold ${sinStk ? "text-red-600" : bajo ? "text-amber-600" : "text-gray-800"}`}>
                          {stock.toNumber()} {p.unidadMedida}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">{minimo.toNumber()}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{fmtCRC(p.precioVenta)}</td>
                        <td className="px-4 py-3">
                          {sinStk ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Sin stock</span>
                          ) : bajo ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Stock bajo</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Leche Cruda ── */}
      {activeTab === "leche" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Recibido hoy",         value: "285 L",    emoji: "🥛", color: "#10b981" },
              { label: "Recibido este mes",     value: "6,847 L",  emoji: "📊", color: "#6366f1" },
              { label: "Proveedores activos",   value: "3",        emoji: "🚜", color: "#f59e0b" },
              { label: "Temperatura entrada",   value: "4.2 °C",   emoji: "🌡️", color: "#06b6d4" },
            ].map((s, i) => (
              <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 card-hover-glow animate-scale-in"
                style={{ animationDelay: `${i * 60}ms` }}>
                <div className="text-2xl mb-1">{s.emoji}</div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Droplets className="h-5 w-5 text-emerald-500" />
              Tanque de leche cruda — Junio 2026
            </h2>
            <MilkTank litros={LECHE_DATA.recibitoMes} meta={LECHE_DATA.metaMensual} />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Últimas recepciones</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Fecha</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Proveedor</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Litros</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">% Grasa</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">% Proteína</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {LECHE_DATA.tabla.map((row) => (
                  <tr key={row.fecha + row.proveedor} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{row.fecha}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{row.proveedor}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{row.litros.toLocaleString("es-CR")} L</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.grasa}%</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.proteina}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Quesos ── */}
      {activeTab === "quesos" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-amber-500" />
              Producción de quesos — Junio 2026
            </h2>
            <p className="text-sm text-gray-500 mb-6">Meta mensual vs producido por variedad</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {QUESOS_DATA.map((q, i) => (
                <CheeseWheel key={q.nombre} {...q} delay={i * 200} />
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Detalle de producción</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Variedad</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Producido</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Meta</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Avance</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {QUESOS_DATA.map((q) => {
                  const pct = Math.round((q.producido / q.meta) * 100);
                  return (
                    <tr key={q.nombre} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: q.color }} />
                          <span className="font-medium text-gray-800">{q.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-800">{q.producido} kg</td>
                      <td className="px-4 py-3 text-right text-gray-500">{q.meta} kg</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: q.color }} />
                          </div>
                          <span className="text-xs font-medium text-gray-700">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {pct >= 100
                          ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Completado ✓</span>
                          : pct >= 75
                            ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">En progreso</span>
                            : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pendiente</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Merma ── */}
      {activeTab === "merma" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MERMA_DATA.map((m, i) => {
              const isOk    = m.estado === "ok";
              const isAlerta = m.estado === "alerta";
              const color   = isOk ? "#10b981" : isAlerta ? "#f59e0b" : "#ef4444";
              const bg      = isOk ? "#f0fdf4"  : isAlerta ? "#fffbeb"  : "#fef2f2";
              const border  = isOk ? "#bbf7d0"  : isAlerta ? "#fde68a"  : "#fecaca";
              return (
                <div key={m.producto} className="rounded-xl p-5 card-hover-glow animate-scale-in"
                  style={{ background: bg, border: `1px solid ${border}`, animationDelay: `${i * 80}ms` }}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{m.producto}</h3>
                      <p className="text-xs text-gray-500">{m.cantidad} {m.unidad} perdidos este mes</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ color, background: `${color}18` }}>
                      {isOk ? "Bajo control" : isAlerta ? "⚠ Alerta" : "🔴 Crítico"}
                    </span>
                  </div>
                  <MermaGauge pct={m.pct} objetivo={m.objetivo} />
                </div>
              );
            })}
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
            <Award className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-sm text-emerald-800">
              <strong>Merma total del mes:</strong> Promedio ponderado de 2.3%, dentro del objetivo del 3.0%.
              Mantequilla requiere atención (3.8% vs objetivo 3.0%).
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Rendimientos ── */}
      {activeTab === "rendimientos" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" />
              Rendimientos de producción
            </h2>
            <p className="text-sm text-gray-500 mb-6">Litros de leche por kilogramo de queso — línea gris indica estándar</p>
            <div className="space-y-6">
              {RENDIMIENTOS_DATA.map((r, i) => (
                <YieldBar key={r.queso} {...r} delay={i * 120} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Mejor rendimiento", value: "Turrialba",  sub: "8.4 L/kg",   color: "#10b981" },
              { label: "Leche procesada",   value: "2,831 L",    sub: "este mes",    color: "#6366f1" },
              { label: "Total queso",       value: "399 kg",     sub: "producidos",  color: "#f59e0b" },
              { label: "Eficiencia global", value: "96.2%",      sub: "vs estándar", color: "#ec4899" },
            ].map((c, i) => (
              <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4 card-hover-glow animate-scale-in"
                style={{ animationDelay: `${i * 60}ms` }}>
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className="text-xl font-bold mt-1" style={{ color: c.color }}>{c.value}</p>
                <p className="text-xs text-gray-400">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
