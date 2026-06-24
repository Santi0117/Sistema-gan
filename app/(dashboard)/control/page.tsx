import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText, TrendingUp, AlertTriangle, Package,
  Users, CreditCard, Clock, CheckCircle,
} from "lucide-react";
import Decimal from "decimal.js";

// ─── Data loaders (DB con fallback a mock) ────────────────────────────────────

async function getDashboardStats(empresaId: string) {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  try {
    const { db, factura, producto, cliente } = await import("@/infrastructure/db");
    const { eq, and, gte, count, sql } = await import("drizzle-orm");

    const [
      [facturasMes],
      [ventasMes],
      [pendientesMH],
      [stockBajo],
      [totalClientes],
      [creditosVencidos],
      ultimasFacturas,
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
        id: factura.id, consecutivo: factura.consecutivo,
        tipoComprobante: factura.tipoComprobante, fecha: factura.fecha,
        total: factura.total, estado: factura.estado, estadoMH: factura.estadoMH,
        clienteId: factura.clienteId,
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
    // Mock fallback
    return {
      facturasMes: 4,
      ventasMes: new Decimal("34246.00"),
      pendientesMH: 1,
      stockBajo: 3,
      totalClientes: 5,
      creditosVencidos: 1,
      ultimasFacturas: [
        { id: "f4", consecutivo: null, tipoComprobante: "NORMAL", fecha: new Date("2026-06-24"), total: "10891.00000", estado: "ACTIVA", estadoMH: "NO_APLICA", clienteId: "c2", clienteNombre: "María González" },
        { id: "f3", consecutivo: "00100100101000000003", tipoComprobante: "FE", fecha: new Date("2026-06-22"), total: "18500.00000", estado: "ACTIVA", estadoMH: "PENDIENTE", clienteId: "c3", clienteNombre: "Distribuidora Norte" },
        { id: "f2", consecutivo: "00100100400000000002", tipoComprobante: "TE", fecha: new Date("2026-06-21"), total: "900.00000", estado: "ACTIVA", estadoMH: "ACEPTADA", clienteId: "c4", clienteNombre: "Consumidor Final" },
        { id: "f1", consecutivo: "00100100101000000001", tipoComprobante: "FE", fecha: new Date("2026-06-20"), total: "3955.00000", estado: "ACTIVA", estadoMH: "ACEPTADA", clienteId: "c1", clienteNombre: "Supermercado El Maíz" },
      ],
    };
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

const ESTADO_MH_CFG: Record<string, { label: string; cls: string }> = {
  NO_APLICA: { label: "N/A", cls: "bg-gray-100 text-gray-500" },
  PENDIENTE: { label: "Pendiente", cls: "bg-orange-100 text-orange-700" },
  EN_PROCESO: { label: "En proceso", cls: "bg-blue-100 text-blue-700" },
  ACEPTADA: { label: "Aceptada", cls: "bg-green-100 text-green-700" },
  RECHAZADA: { label: "Rechazada", cls: "bg-red-100 text-red-700" },
  ERROR: { label: "Error", cls: "bg-red-100 text-red-700" },
};

const TIPO_LABELS: Record<string, string> = {
  FE: "Fact. Elect.", TE: "Tiquete", ND: "Nota Déb.", NC: "Nota Cré.",
  FEC: "F. Compra", REP: "Recibo", NORMAL: "Fact. Local",
};

export default async function ControlPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const stats = await getDashboardStats(session.empresaId);

  const horaActual = new Date().getHours();
  const saludo = horaActual < 12 ? "Buen día" : horaActual < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {saludo}, {session.nombre.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString("es-CR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Facturas del mes"
          value={String(stats.facturasMes)}
          icon={FileText}
          href="/ventas"
          color="orange"
        />
        <KPICard
          label="Ventas del mes"
          value={`₡${stats.ventasMes.toDecimalPlaces(0).toNumber().toLocaleString("es-CR")}`}
          icon={TrendingUp}
          href="/reportes/ventas-mensual"
          color="green"
        />
        <KPICard
          label="Pendientes MH"
          value={String(stats.pendientesMH)}
          icon={Clock}
          href="/ventas"
          color={stats.pendientesMH > 0 ? "warn" : "gray"}
          badge={stats.pendientesMH > 0 ? "Requiere acción" : undefined}
        />
        <KPICard
          label="Stock bajo"
          value={String(stats.stockBajo)}
          icon={Package}
          href="/inventario"
          color={stats.stockBajo > 0 ? "red" : "gray"}
          badge={stats.stockBajo > 0 ? `${stats.stockBajo} producto${stats.stockBajo !== 1 ? "s" : ""}` : undefined}
        />
      </div>

      {/* KPIs secundarios */}
      <div className="grid grid-cols-2 gap-4">
        <KPICard
          label="Clientes activos"
          value={String(stats.totalClientes)}
          icon={Users}
          href="/clientes"
          color="gray"
          small
        />
        <KPICard
          label="Créditos pendientes"
          value={String(stats.creditosVencidos)}
          icon={CreditCard}
          href="/reportes/creditos"
          color={stats.creditosVencidos > 0 ? "warn" : "gray"}
          small
        />
      </div>

      {/* Alertas */}
      <Alertas pendientesMH={stats.pendientesMH} stockBajo={stats.stockBajo} creditosVencidos={stats.creditosVencidos} />

      {/* Últimas facturas */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Últimos comprobantes</h2>
          <Link href="/ventas" className="text-xs text-orange-600 hover:text-orange-700 font-medium">
            Ver todos →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {stats.ultimasFacturas.map((f) => {
            const mhCfg = ESTADO_MH_CFG[(f.estadoMH as string) ?? "NO_APLICA"] ?? ESTADO_MH_CFG.NO_APLICA;
            const nombre = (f as { clienteNombre?: string }).clienteNombre ?? "—";
            return (
              <Link
                key={f.id}
                href={`/ventas/${f.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate group-hover:text-orange-600 transition-colors">
                    {nombre}
                  </p>
                  <p className="text-xs text-gray-400">
                    {TIPO_LABELS[f.tipoComprobante as string] ?? f.tipoComprobante}
                    {" · "}
                    {(f.fecha as Date).toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit" })}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-gray-800">
                    ₡{new Decimal(f.total as string ?? "0").toDecimalPlaces(0).toNumber().toLocaleString("es-CR")}
                  </p>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${mhCfg.cls}`}>
                    {mhCfg.label}
                  </span>
                </div>
              </Link>
            );
          })}
          {stats.ultimasFacturas.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400">Sin facturas aún.</p>
              <Link href="/ventas/nueva" className="text-sm text-orange-600 font-medium mt-1 block">
                Emitir la primera factura →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction href="/ventas/nueva" label="Nueva factura" emoji="🧾" />
          <QuickAction href="/clientes/nuevo" label="Nuevo cliente" emoji="👤" />
          <QuickAction href="/productos/nuevo" label="Nuevo producto" emoji="📦" />
          <QuickAction href="/reportes/impuestos-ventas" label="D-150 IVA" emoji="📑" />
        </div>
      </div>
    </div>
  );
}

// ─── Componentes internos ─────────────────────────────────────────────────────

function KPICard({
  label, value, icon: Icon, href, color, badge, small,
}: {
  label: string; value: string; icon: React.ElementType; href: string;
  color: "orange" | "green" | "warn" | "red" | "gray"; badge?: string; small?: boolean;
}) {
  const colorMap = {
    orange: { bg: "bg-orange-50", text: "text-orange-600", icon: "text-orange-400" },
    green: { bg: "bg-green-50", text: "text-green-700", icon: "text-green-400" },
    warn: { bg: "bg-amber-50", text: "text-amber-700", icon: "text-amber-400" },
    red: { bg: "bg-red-50", text: "text-red-700", icon: "text-red-400" },
    gray: { bg: "bg-white", text: "text-gray-900", icon: "text-gray-400" },
  };
  const c = colorMap[color];

  return (
    <Link href={href} className={`${c.bg} border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all block group`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500">{label}</p>
        <Icon size={14} className={c.icon} />
      </div>
      <p className={`font-bold ${small ? "text-xl" : "text-2xl"} ${c.text}`}>{value}</p>
      {badge && (
        <span className="mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full bg-white/80 text-gray-600 font-medium">
          {badge}
        </span>
      )}
    </Link>
  );
}

function Alertas({ pendientesMH, stockBajo, creditosVencidos }: {
  pendientesMH: number; stockBajo: number; creditosVencidos: number;
}) {
  const alertas = [
    pendientesMH > 0 && {
      icon: Clock, cls: "bg-orange-50 border-orange-200 text-orange-800",
      msg: `${pendientesMH} comprobante${pendientesMH !== 1 ? "s" : ""} pendiente${pendientesMH !== 1 ? "s" : ""} de envío a Hacienda.`,
      link: "/ventas", cta: "Ver comprobantes",
    },
    stockBajo > 0 && {
      icon: Package, cls: "bg-red-50 border-red-200 text-red-800",
      msg: `${stockBajo} producto${stockBajo !== 1 ? "s" : ""} con stock bajo o agotado.`,
      link: "/inventario", cta: "Ver inventario",
    },
    creditosVencidos > 0 && {
      icon: CreditCard, cls: "bg-amber-50 border-amber-200 text-amber-800",
      msg: `${creditosVencidos} factura${creditosVencidos !== 1 ? "s" : ""} a crédito pendiente${creditosVencidos !== 1 ? "s" : ""} de cobro.`,
      link: "/reportes/creditos", cta: "Ver créditos",
    },
  ].filter(Boolean) as { icon: React.ElementType; cls: string; msg: string; link: string; cta: string }[];

  if (alertas.length === 0) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
        <CheckCircle className="h-4 w-4 shrink-0" />
        Todo en orden — sin alertas pendientes.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alertas.map(({ icon: Icon, cls, msg, link, cta }, i) => (
        <div key={i} className={`flex items-center gap-3 border rounded-xl px-4 py-3 ${cls}`}>
          <Icon className="h-4 w-4 shrink-0" />
          <span className="text-sm flex-1">{msg}</span>
          <Link href={link} className="text-xs font-medium underline shrink-0">{cta} →</Link>
        </div>
      ))}
    </div>
  );
}

function QuickAction({ href, label, emoji }: { href: string; label: string; emoji: string }) {
  return (
    <Link
      href={href}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-orange-200 transition-all text-center group"
    >
      <div className="text-2xl mb-1.5">{emoji}</div>
      <p className="text-xs text-gray-600 font-medium group-hover:text-orange-600 transition-colors">{label}</p>
    </Link>
  );
}
