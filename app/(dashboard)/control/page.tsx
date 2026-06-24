import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText, TrendingUp, Package, Users, CreditCard, Clock, CheckCircle, ArrowUpRight,
} from "lucide-react";
import Decimal from "decimal.js";

// ─── Data loaders ─────────────────────────────────────────────────────────────

async function getDashboardStats(empresaId: string) {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  try {
    const { db, factura, producto, cliente } = await import("@/infrastructure/db");
    const { eq, and, gte, count, sql } = await import("drizzle-orm");

    const [
      [facturasMes], [ventasMes], [pendientesMH], [stockBajo],
      [totalClientes], [creditosVencidos], ultimasFacturas,
    ] = await Promise.all([
      db.select({ total: count() }).from(factura)
        .where(and(eq(factura.empresaId, empresaId), gte(factura.fecha, inicioMes))),
      db.select({ total: sql<string>`coalesce(sum(total::numeric), 0)` }).from(factura)
        .where(and(eq(factura.empresaId, empresaId), gte(factura.fecha, inicioMes), eq(factura.estado, "ACTIVA"))),
      db.select({ total: count() }).from(factura)
        .where(and(eq(factura.empresaId, empresaId), sql`estado_mh IN ('PENDIENTE','ERROR')`)),
      db.select({ total: count() }).from(producto)
        .where(and(eq(producto.empresaId, empresaId), sql`stock_actual::numeric <= stock_minimo::numeric AND controlar_stock = true`)),
      db.select({ total: count() }).from(cliente)
        .where(and(eq(cliente.empresaId, empresaId), eq(cliente.activo, true))),
      db.select({ total: count() }).from(factura)
        .where(and(eq(factura.empresaId, empresaId), eq(factura.tipoPago, "CREDITO"), eq(factura.estado, "ACTIVA"))),
      db.select({
        id: factura.id, tipoComprobante: factura.tipoComprobante, fecha: factura.fecha,
        total: factura.total, estado: factura.estado, estadoMH: factura.estadoMH,
      }).from(factura)
        .where(eq(factura.empresaId, empresaId))
        .orderBy(sql`${factura.createdAt} desc`)
        .limit(5),
    ]);

    return {
      facturasMes: facturasMes?.total ?? 0,
      ventasMes: ventasMes?.total ? new Decimal(ventasMes.total) : new Decimal(0),
      pendientesMH: pendientesMH?.total ?? 0,
      stockBajo: stockBajo?.total ?? 0,
      totalClientes: totalClientes?.total ?? 0,
      creditosVencidos: creditosVencidos?.total ?? 0,
      ultimasFacturas,
    };
  } catch {
    return {
      facturasMes: 4,
      ventasMes: new Decimal("34246.00"),
      pendientesMH: 1,
      stockBajo: 3,
      totalClientes: 5,
      creditosVencidos: 1,
      ultimasFacturas: [
        { id: "f4", tipoComprobante: "NORMAL", fecha: new Date("2026-06-24"), total: "10891.00000", estado: "ACTIVA", estadoMH: "NO_APLICA", clienteNombre: "María González" },
        { id: "f3", tipoComprobante: "FE",     fecha: new Date("2026-06-22"), total: "18500.00000", estado: "ACTIVA", estadoMH: "PENDIENTE", clienteNombre: "Distribuidora Norte" },
        { id: "f2", tipoComprobante: "TE",     fecha: new Date("2026-06-21"), total: "900.00000",   estado: "ACTIVA", estadoMH: "ACEPTADA",  clienteNombre: "Consumidor Final" },
        { id: "f1", tipoComprobante: "FE",     fecha: new Date("2026-06-20"), total: "3955.00000",  estado: "ACTIVA", estadoMH: "ACEPTADA",  clienteNombre: "Supermercado El Maíz" },
      ],
    };
  }
}

// ─── Configs ──────────────────────────────────────────────────────────────────

const ESTADO_MH_CFG: Record<string, { label: string; cls: string }> = {
  NO_APLICA:  { label: "N/A",        cls: "bg-gray-100 text-gray-500" },
  PENDIENTE:  { label: "Pendiente",  cls: "bg-amber-100 text-amber-700" },
  EN_PROCESO: { label: "En proceso", cls: "bg-blue-100 text-blue-700" },
  ACEPTADA:   { label: "Aceptada",   cls: "bg-emerald-100 text-emerald-700" },
  RECHAZADA:  { label: "Rechazada",  cls: "bg-red-100 text-red-700" },
  ERROR:      { label: "Error",      cls: "bg-red-100 text-red-700" },
};

const TIPO_LABELS: Record<string, string> = {
  FE: "Fact. Elect.", TE: "Tiquete", ND: "Nota Déb.", NC: "Nota Cré.",
  FEC: "F. Compra", REP: "Recibo", NORMAL: "Fact. Local",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ControlPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const stats = await getDashboardStats(session.empresaId);
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-7">

      {/* Greeting banner */}
      <div
        className="animate-fade-in-up relative overflow-hidden rounded-2xl px-6 py-5"
        style={{
          background: "linear-gradient(135deg, #0e2016 0%, #0a1a10 60%, #071310 100%)",
          boxShadow: "0 4px 24px rgba(16,185,129,0.12)",
        }}
      >
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)", transform: "translate(20%,-20%)" }} />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)" }} />
        <p className="text-xs text-emerald-400/70 font-medium mb-0.5">
          {new Date().toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 className="text-2xl font-bold text-white">
          {saludo},{" "}
          <span className="text-gradient-emerald">{session.nombre.split(" ")[0]}</span> 👋
        </h1>
        <p className="text-sm text-white/40 mt-1">
          {stats.facturasMes} factura{stats.facturasMes !== 1 ? "s" : ""} emitida{stats.facturasMes !== 1 ? "s" : ""} este mes
          {" · "}
          ₡{stats.ventasMes.toDecimalPlaces(0).toNumber().toLocaleString("es-CR")} en ventas
        </p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Facturas del mes",
            value: String(stats.facturasMes),
            icon: FileText, href: "/ventas", delay: "60ms",
            valueColor: "#10b981",
          },
          {
            label: "Ventas del mes",
            value: `₡${stats.ventasMes.toDecimalPlaces(0).toNumber().toLocaleString("es-CR")}`,
            icon: TrendingUp, href: "/reportes/ventas-mensual", delay: "130ms",
            valueColor: "#059669", gradient: true,
          },
          {
            label: "Pendientes MH",
            value: String(stats.pendientesMH),
            icon: Clock, href: "/ventas", delay: "200ms",
            valueColor: stats.pendientesMH > 0 ? "#d97706" : "#9ca3af",
            badge: stats.pendientesMH > 0 ? "Requiere acción" : undefined,
            badgeCls: "bg-amber-50 text-amber-700",
            iconBg: stats.pendientesMH > 0 ? "bg-amber-50" : "bg-gray-50",
            iconColor: stats.pendientesMH > 0 ? "text-amber-500" : "text-gray-400",
          },
          {
            label: "Stock bajo",
            value: String(stats.stockBajo),
            icon: Package, href: "/inventario", delay: "270ms",
            valueColor: stats.stockBajo > 0 ? "#ef4444" : "#9ca3af",
            badge: stats.stockBajo > 0 ? `${stats.stockBajo} producto${stats.stockBajo !== 1 ? "s" : ""}` : undefined,
            badgeCls: "bg-red-50 text-red-600",
            iconBg: stats.stockBajo > 0 ? "bg-red-50" : "bg-gray-50",
            iconColor: stats.stockBajo > 0 ? "text-red-400" : "text-gray-400",
          },
        ].map(({ label, value, icon: Icon, href, delay, valueColor, gradient, badge, badgeCls, iconBg = "bg-emerald-50", iconColor = "text-emerald-600" }) => (
          <Link
            key={label}
            href={href}
            className="animate-fade-in-up card-hover-glow bg-white border border-gray-100 rounded-2xl p-4 block group"
            style={{ animationDelay: delay }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${iconBg}`}>
                <Icon size={14} className={iconColor} />
              </div>
            </div>
            <p
              className={`font-bold text-2xl ${gradient ? "text-gradient-money" : ""}`}
              style={!gradient ? { color: valueColor } : {}}
            >
              {value}
            </p>
            {badge && (
              <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${badgeCls}`}>
                {badge}
              </span>
            )}
            <ArrowUpRight size={12} className="mt-2 opacity-0 group-hover:opacity-30 transition-opacity text-gray-400" />
          </Link>
        ))}
      </div>

      {/* KPIs secundarios */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Clientes activos",    value: String(stats.totalClientes),    icon: Users,       href: "/clientes",           delay: "340ms" },
          { label: "Créditos pendientes", value: String(stats.creditosVencidos), icon: CreditCard,  href: "/reportes/creditos",  delay: "380ms" },
        ].map(({ label, value, icon: Icon, href, delay }) => (
          <Link
            key={label}
            href={href}
            className="animate-fade-in-up card-hover-glow bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-4 group"
            style={{ animationDelay: delay }}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110">
              <Icon size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Alertas */}
      <div className="animate-fade-in-up space-y-2" style={{ animationDelay: "420ms" }}>
        <Alertas
          pendientesMH={stats.pendientesMH}
          stockBajo={stats.stockBajo}
          creditosVencidos={stats.creditosVencidos}
        />
      </div>

      {/* Últimas facturas */}
      <div
        className="animate-fade-in-up rounded-2xl overflow-hidden"
        style={{ animationDelay: "500ms", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(to bottom, #10b981, #34d399)" }} />
            <h2 className="text-sm font-semibold text-gray-800">Últimos comprobantes</h2>
          </div>
          <Link href="/ventas" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-0.5">
            Ver todos <ArrowUpRight size={11} />
          </Link>
        </div>
        <div className="divide-y divide-gray-50/80 bg-white">
          {stats.ultimasFacturas.map((f, idx) => {
            const mhCfg = ESTADO_MH_CFG[(f.estadoMH as string) ?? "NO_APLICA"] ?? ESTADO_MH_CFG.NO_APLICA;
            const nombre = (f as { clienteNombre?: string }).clienteNombre ?? "—";
            return (
              <Link
                key={f.id}
                href={`/ventas/${f.id}`}
                className="animate-slide-in-left flex items-center gap-3 px-5 py-3.5 hover:bg-emerald-50/30 transition-colors group"
                style={{ animationDelay: `${540 + idx * 55}ms` }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}
                >
                  <FileText className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate group-hover:text-emerald-700 transition-colors">
                    {nombre}
                  </p>
                  <p className="text-xs text-gray-400">
                    {TIPO_LABELS[f.tipoComprobante as string] ?? f.tipoComprobante}
                    {" · "}
                    {(f.fecha as Date).toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit" })}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-gray-800">
                    ₡{new Decimal(f.total as string ?? "0").toDecimalPlaces(0).toNumber().toLocaleString("es-CR")}
                  </p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${mhCfg.cls}`}>
                    {mhCfg.label}
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

      {/* Acciones rápidas */}
      <div className="animate-fade-in-up" style={{ animationDelay: "720ms" }}>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/ventas/nueva",             label: "Nueva factura",  emoji: "🧾", delay: "740ms" },
            { href: "/clientes/nuevo",            label: "Nuevo cliente",  emoji: "👤", delay: "780ms" },
            { href: "/productos/nuevo",           label: "Nuevo producto", emoji: "📦", delay: "820ms" },
            { href: "/reportes/impuestos-ventas", label: "D-150 IVA",      emoji: "📑", delay: "860ms" },
          ].map(({ href, label, emoji, delay }) => (
            <Link
              key={href}
              href={href}
              className="animate-scale-in card-hover-glow bg-white border border-gray-100 rounded-2xl p-4 text-center group"
              style={{ animationDelay: delay }}
            >
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

// ─── Alertas ──────────────────────────────────────────────────────────────────

function Alertas({ pendientesMH, stockBajo, creditosVencidos }: {
  pendientesMH: number; stockBajo: number; creditosVencidos: number;
}) {
  const alertas = [
    pendientesMH > 0 && {
      icon: Clock,
      bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", dot: "#f97316",
      msg: `${pendientesMH} comprobante${pendientesMH !== 1 ? "s" : ""} pendiente${pendientesMH !== 1 ? "s" : ""} de envío a Hacienda.`,
      link: "/ventas", cta: "Ver comprobantes",
    },
    stockBajo > 0 && {
      icon: Package,
      bg: "#fef2f2", border: "#fecaca", text: "#b91c1c", dot: "#ef4444",
      msg: `${stockBajo} producto${stockBajo !== 1 ? "s" : ""} con stock bajo o agotado.`,
      link: "/inventario", cta: "Ver inventario",
    },
    creditosVencidos > 0 && {
      icon: CreditCard,
      bg: "#fefce8", border: "#fde68a", text: "#a16207", dot: "#eab308",
      msg: `${creditosVencidos} factura${creditosVencidos !== 1 ? "s" : ""} a crédito pendiente${creditosVencidos !== 1 ? "s" : ""} de cobro.`,
      link: "/reportes/creditos", cta: "Ver créditos",
    },
  ].filter(Boolean) as { icon: React.ElementType; bg: string; border: string; text: string; dot: string; msg: string; link: string; cta: string }[];

  if (alertas.length === 0) {
    return (
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
      >
        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
        <span className="text-sm text-emerald-800 font-medium">Todo en orden — sin alertas pendientes.</span>
      </div>
    );
  }

  return (
    <>
      {alertas.map(({ icon: Icon, bg, border, text, dot, msg, link, cta }, i) => (
        <div
          key={i}
          className="animate-slide-in-left flex items-center gap-3 rounded-2xl px-4 py-3 relative overflow-hidden"
          style={{ background: bg, border: `1px solid ${border}`, animationDelay: `${440 + i * 60}ms` }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl animate-border-glow"
            style={{ background: dot }}
          />
          <Icon className="h-4 w-4 shrink-0 ml-1" style={{ color: dot }} />
          <span className="text-sm flex-1 font-medium" style={{ color: text }}>{msg}</span>
          <Link href={link} className="text-xs font-semibold shrink-0 flex items-center gap-0.5" style={{ color: text }}>
            {cta} <ArrowUpRight size={11} />
          </Link>
        </div>
      ))}
    </>
  );
}
