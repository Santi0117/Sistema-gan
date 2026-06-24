const HACIENDA_API = process.env.HACIENDA_API_URL ?? "https://api.hacienda.go.cr";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 h

export interface CabysResult {
  codigo: string;
  descripcion: string;
  impuesto: number;
}

// Caché en memoria — Hacienda penaliza consultas repetitivas
const cabysCache = new Map<string, { data: CabysResult[]; ts: number }>();

export async function buscarCABYS(query: string): Promise<CabysResult[]> {
  const key = query.toLowerCase().trim();
  if (key.length < 3) return [];

  const cached = cabysCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  try {
    const url = `${HACIENDA_API}/fe/cabys?q=${encodeURIComponent(key)}&top=15`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const data: CabysResult[] = (json.cabys ?? []).map(
      (item: { codigo: string; descripcion: string; impuesto?: number }) => ({
        codigo: item.codigo,
        descripcion: item.descripcion,
        impuesto: item.impuesto ?? 0,
      })
    );

    cabysCache.set(key, { data, ts: Date.now() });
    return data;
  } catch (err) {
    console.warn("[CABYS] Error consultando Hacienda:", (err as Error).message);
    return [];
  }
}

// ─── Contribuyente lookup ──────────────────────────────────────────────────────

export interface ContribuyenteResult {
  nombre: string;
  tipoIdentificacion: string;
  situacion: string;
  actividades: { codigo: string; descripcion: string; estado: string }[];
}

const contribuyenteCache = new Map<string, { data: ContribuyenteResult | null; ts: number }>();
const CONTRIB_CACHE_TTL_MS = 1000 * 60 * 60; // 1 h (menos que CABYS — puede cambiar)

export async function buscarContribuyente(
  identificacion: string
): Promise<ContribuyenteResult | null> {
  const key = identificacion.trim().replace(/\D/g, "");
  if (!key) return null;

  const cached = contribuyenteCache.get(key);
  if (cached && Date.now() - cached.ts < CONTRIB_CACHE_TTL_MS) return cached.data;

  try {
    const url = `${HACIENDA_API}/fe/ae?identificacion=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      contribuyenteCache.set(key, { data: null, ts: Date.now() });
      return null;
    }
    const json = await res.json();
    const result: ContribuyenteResult = {
      nombre: json.nombre ?? "",
      tipoIdentificacion: json.tipoIdentificacion?.codigo ?? "",
      situacion: json.situacion?.moroso === "N" ? "Al día" : "Con mora",
      actividades: (json.actividades ?? []).map(
        (a: { codigo: string; descripcion: string; estado: string }) => ({
          codigo: a.codigo,
          descripcion: a.descripcion,
          estado: a.estado,
        })
      ),
    };
    contribuyenteCache.set(key, { data: result, ts: Date.now() });
    return result;
  } catch (err) {
    console.warn("[CONTRIB] Error consultando Hacienda:", (err as Error).message);
    return null;
  }
}

export async function obtenerTipoCambioUSD(): Promise<number> {
  try {
    const res = await fetch(`${HACIENDA_API}/indicadores/tc/dolar`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 }, // 1 h
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return parseFloat(json.venta?.valor ?? json.compra?.valor ?? "500");
  } catch {
    return 500; // fallback
  }
}
