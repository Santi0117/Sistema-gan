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
