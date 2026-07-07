import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { obtenerRutas } from "./actions";
import Link from "next/link";
import { Plus, Users, Truck, Activity } from "lucide-react";

const DIAS_CORTO: Record<string, string> = {
  lunes: "L", martes: "M", miércoles: "X", jueves: "J",
  viernes: "V", sábado: "S", domingo: "D",
};

// Emerald shades per route index
const ROUTE_COLORS = ["#10b981", "#34d399", "#6ee7b7", "#059669", "#047857", "#0d9488"];

export default async function RutasPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const rutas = await obtenerRutas();
  const activas = rutas.filter((r) => r.activa).length;
  const totalClientes = rutas.reduce((a, r) => a + r.totalClientes, 0);

  // Compute hub-and-spoke positions
  const HUB_X = 310;
  const HUB_Y = 155;
  const RADIUS = 125;

  const spokes = rutas.map((ruta, i) => {
    const angle = (i / rutas.length) * 2 * Math.PI - Math.PI / 2;
    const ex = Math.round(HUB_X + RADIUS * Math.cos(angle));
    const ey = Math.round(HUB_Y + RADIUS * Math.sin(angle));
    const color = ruta.activa ? (ROUTE_COLORS[i % ROUTE_COLORS.length]) : "#374151";
    const strokeColor = ruta.activa ? color : "#4b5563";
    const dur1 = (2.2 + i * 0.35).toFixed(1);
    const dur2 = (2.8 + i * 0.2).toFixed(1);
    const begin2 = ((2.2 + i * 0.35) / 2).toFixed(1);
    return { ruta, ex, ey, color, strokeColor, dur1, dur2, begin2 };
  });

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rutas</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activas} activa{activas !== 1 ? "s" : ""} · {rutas.length} total · {totalClientes} clientes
          </p>
        </div>
        <Link
          href="/rutas/nueva"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:scale-[1.02]"
          style={{
            background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
            boxShadow: "0 4px 14px rgba(16,185,129,0.35)",
          }}
        >
          <Plus className="h-4 w-4" />
          Nueva ruta
        </Link>
      </div>

      {/* ── Delivery Network Animation ── */}
      <div
        className="relative rounded-2xl overflow-hidden animate-fade-in"
        style={{
          background: "linear-gradient(145deg, #071310 0%, #0a1a0f 50%, #071310 100%)",
          border: "1px solid rgba(52,211,153,0.15)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
        }}
      >
        {/* Ambient glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.07) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-8 w-48 h-28 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(52,211,153,0.04) 0%, transparent 70%)" }} />

        <div className="relative px-5 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-300">Red de distribución</span>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-500/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-glow-pulse inline-block" />
              En operación
            </span>
          </div>

          {rutas.length === 0 ? (
            <div className="text-center py-12 text-emerald-500/40 text-sm">
              Sin rutas. Crea la primera ruta para ver la red.
            </div>
          ) : (
            <svg
              viewBox="0 0 620 310"
              className="w-full h-auto"
              xmlns="http://www.w3.org/2000/svg"
              style={{ maxHeight: "280px" }}
            >
              {/* Dot grid background */}
              <defs>
                <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.8" fill="rgba(52,211,153,0.08)" />
                </pattern>
                {/* Glow filter */}
                <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="hub-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              <rect width="620" height="310" fill="url(#dots)" />

              {/* ── Spoke lines ── */}
              {spokes.map(({ ruta, ex, ey, strokeColor }) => (
                <line key={`line-${ruta.id}`}
                  x1={HUB_X} y1={HUB_Y} x2={ex} y2={ey}
                  stroke={strokeColor}
                  strokeWidth="1.5"
                  strokeDasharray="6,5"
                  opacity={ruta.activa ? "0.45" : "0.2"}
                />
              ))}

              {/* ── Traveling delivery dots ── */}
              {spokes.map(({ ruta, ex, ey, color, dur1, dur2, begin2 }) =>
                ruta.activa ? (
                  <g key={`dots-${ruta.id}`}>
                    {/* First dot */}
                    <circle r="4.5" fill={color} opacity="0.9" filter="url(#glow)">
                      <animateMotion
                        path={`M${HUB_X},${HUB_Y} L${ex},${ey}`}
                        dur={`${dur1}s`}
                        begin="0s"
                        repeatCount="indefinite"
                      />
                      <animate attributeName="opacity" values="0;0.9;0.9;0" dur={`${dur1}s`} repeatCount="indefinite" />
                    </circle>
                    {/* Second dot (offset) */}
                    <circle r="3" fill={color} opacity="0.6">
                      <animateMotion
                        path={`M${HUB_X},${HUB_Y} L${ex},${ey}`}
                        dur={`${dur2}s`}
                        begin={`${begin2}s`}
                        repeatCount="indefinite"
                      />
                      <animate attributeName="opacity" values="0;0.6;0.6;0" dur={`${dur2}s`} begin={`${begin2}s`} repeatCount="indefinite" />
                    </circle>
                  </g>
                ) : null
              )}

              {/* ── Hub (center) ── */}
              {/* Outer glow rings */}
              <circle cx={HUB_X} cy={HUB_Y} r="40" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.15">
                <animate attributeName="r" values="36;46;36" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.15;0.04;0.15" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx={HUB_X} cy={HUB_Y} r="50" fill="none" stroke="#10b981" strokeWidth="0.8" opacity="0.08">
                <animate attributeName="r" values="46;58;46" dur="3s" begin="0.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.08;0.02;0.08" dur="3s" begin="0.5s" repeatCount="indefinite" />
              </circle>
              {/* Hub body */}
              <circle cx={HUB_X} cy={HUB_Y} r="32" fill="#0d2016" stroke="#10b981" strokeWidth="2.5" filter="url(#hub-glow)" />
              <circle cx={HUB_X} cy={HUB_Y} r="32" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.4">
                <animate attributeName="stroke-opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Hub text */}
              <text x={HUB_X} y={HUB_Y - 5} textAnchor="middle" fontSize="9" fontWeight="800" fill="#6ee7b7" letterSpacing="0.5">
                SistemaGan
              </text>
              <text x={HUB_X} y={HUB_Y + 8} textAnchor="middle" fontSize="7.5" fill="#34d399" opacity="0.8">
                Central
              </text>

              {/* ── Endpoint nodes ── */}
              {spokes.map(({ ruta, ex, ey, color, strokeColor }) => (
                <g key={`node-${ruta.id}`}>
                  {/* Pulse ring for active */}
                  {ruta.activa && (
                    <circle cx={ex} cy={ey} r="20" fill="none" stroke={color} strokeWidth="1" opacity="0">
                      <animate attributeName="r" values="16;26;16" dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Node body */}
                  <circle cx={ex} cy={ey} r="18"
                    fill="#0a1a0f"
                    stroke={strokeColor}
                    strokeWidth="1.8"
                    opacity={ruta.activa ? 1 : 0.5}
                  />
                  {/* Route label */}
                  <text x={ex} y={ey - 2} textAnchor="middle" fontSize="7.5" fontWeight="700"
                    fill={ruta.activa ? "#a7f3d0" : "#6b7280"}>
                    {ruta.nombre.replace(/ruta\s*/i, "").substring(0, 8)}
                  </text>
                  <text x={ex} y={ey + 9} textAnchor="middle" fontSize="6.5"
                    fill={ruta.activa ? "#34d399" : "#4b5563"}>
                    {ruta.totalClientes} cli.
                  </text>
                </g>
              ))}

              {/* Stats panel (bottom-right corner) */}
              <g transform="translate(448, 252)">
                <rect width="158" height="50" rx="8" fill="rgba(7,19,13,0.85)" stroke="rgba(52,211,153,0.2)" strokeWidth="0.8" />
                <text x="12" y="16" fontSize="8" fill="rgba(52,211,153,0.5)" fontWeight="600" letterSpacing="0.5">ESTADO DE LA RED</text>
                <circle cx="16" cy="28" r="4" fill="#10b981">
                  <animate attributeName="r" values="3.5;5;3.5" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <text x="26" y="31" fontSize="8.5" fill="#6ee7b7">{activas} ruta{activas!==1?"s":""} activa{activas!==1?"s":""}</text>
                <circle cx="16" cy="43" r="4" fill="#374151" />
                <text x="26" y="46" fontSize="8.5" fill="rgba(167,243,208,0.4)">{rutas.length - activas} inactiva{rutas.length-activas!==1?"s":""}</text>
              </g>
            </svg>
          )}
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Rutas activas",    value: String(activas),        sub: `de ${rutas.length} total`,     color: "#10b981" },
          { label: "Clientes cubiertos", value: String(totalClientes), sub: "en todas las rutas",           color: "#6366f1" },
          { label: "Km estimados/día", value: "420",                  sub: "promedio por ruta activa",      color: "#f59e0b" },
        ].map((k, i) => (
          <div key={k.label}
            className="bg-white border border-gray-200 rounded-xl p-4 card-hover-glow animate-scale-in"
            style={{ animationDelay: `${i * 80}ms` }}>
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Route cards ── */}
      {rutas.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center space-y-3">
          <div className="text-4xl">🛣️</div>
          <p className="text-gray-500">No hay rutas registradas.</p>
          <Link href="/rutas/nueva" className="inline-block text-sm text-emerald-600 font-medium">
            Crear la primera ruta →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rutas.map((ruta, i) => (
            <Link
              key={ruta.id}
              href={`/rutas/${ruta.id}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-emerald-200 transition-all group block card-hover-glow animate-scale-in"
              style={{ animationDelay: `${i * 70 + 200}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {/* Colored dot */}
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        background: ruta.activa ? ROUTE_COLORS[i % ROUTE_COLORS.length] : "#d1d5db",
                        boxShadow: ruta.activa ? `0 0 6px ${ROUTE_COLORS[i % ROUTE_COLORS.length]}80` : "none",
                      }}
                    />
                    <h2 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                      {ruta.nombre}
                    </h2>
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-0.5 ml-4">{ruta.codigo}</p>
                </div>
                <span className={`shrink-0 ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                  ruta.activa ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {ruta.activa ? "Activa" : "Inactiva"}
                </span>
              </div>

              {/* Day indicators */}
              <div className="flex gap-1 mb-4">
                {["lunes","martes","miércoles","jueves","viernes","sábado","domingo"].map((dia) => (
                  <span key={dia}
                    className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center transition-colors ${
                      ruta.dias?.includes(dia)
                        ? "text-emerald-700"
                        : "bg-gray-50 text-gray-300"
                    }`}
                    style={ruta.dias?.includes(dia) ? {
                      background: `${ROUTE_COLORS[i % ROUTE_COLORS.length]}22`,
                      color: ROUTE_COLORS[i % ROUTE_COLORS.length],
                    } : {}}
                  >
                    {DIAS_CORTO[dia]}
                  </span>
                ))}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Users className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span>{ruta.totalClientes} cliente{ruta.totalClientes !== 1 ? "s" : ""}</span>
                </div>
                {ruta.responsableNombre && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center text-[10px]">👤</span>
                    <span className="truncate">{ruta.responsableNombre}</span>
                  </div>
                )}
                {ruta.vehiculo && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Truck className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="truncate">{ruta.vehiculo}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
