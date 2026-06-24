/**
 * Implementación de IHaciendaProvider para TRIBU-CR (reemplazó a ATV oct 2025).
 * Soporta ambiente PRUEBAS (sandbox) y PRODUCCION.
 *
 * TODO: Verificar URLs exactas de TRIBU-CR cuando estén documentadas oficialmente.
 * Los endpoints actuales están basados en la API de recepción de Hacienda v1.
 */

import type {
  IHaciendaProvider,
  EnviarComprobanteInput,
  ConsultaEstadoResult,
  EstadoMH,
} from "./provider.interface";

// ─── Endpoints ────────────────────────────────────────────────────────────────

const ENDPOINTS = {
  PRUEBAS: {
    // TODO: Confirmar URLs definitivas de TRIBU-CR sandbox
    auth: "https://idp.comprobanteselectronicos.go.cr/auth/realms/rut-stag/protocol/openid-connect/token",
    recepcion: "https://api.comprobanteselectronicos.go.cr/recepcion-sandbox/v1/recepcion",
    clientId: "api-stag",
  },
  PRODUCCION: {
    auth: "https://idp.comprobanteselectronicos.go.cr/auth/realms/rut/protocol/openid-connect/token",
    recepcion: "https://api.comprobanteselectronicos.go.cr/recepcion/v1/recepcion",
    clientId: "api-prod",
  },
} as const;

// ─── Caché de token ───────────────────────────────────────────────────────────

interface TokenCache {
  accessToken: string;
  expiresAt: number; // timestamp ms
}

// Por empresa — en un sistema multi-empresa cada empresa tiene sus credenciales
const tokenCache = new Map<string, TokenCache>();

async function obtenerToken(
  ambiente: keyof typeof ENDPOINTS,
  usuario: string,
  clave: string,
  empresaId: string
): Promise<string> {
  const cacheKey = `${empresaId}:${ambiente}`;
  const cached = tokenCache.get(cacheKey);

  // Renovar si expira en menos de 60 segundos
  if (cached && cached.expiresAt - Date.now() > 60_000) {
    return cached.accessToken;
  }

  const ep = ENDPOINTS[ambiente];
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: ep.clientId,
    username: usuario,
    password: clave,
  });

  const res = await fetch(ep.auth, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error autenticando en TRIBU-CR (${res.status}): ${text}`);
  }

  const json = await res.json() as {
    access_token: string;
    expires_in: number;
  };

  tokenCache.set(cacheKey, {
    accessToken: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  });

  return json.access_token;
}

// ─── Implementación ───────────────────────────────────────────────────────────

export interface TribuCRConfig {
  usuario: string;
  clave: string;
  ambiente: "PRUEBAS" | "PRODUCCION";
  empresaId: string;
  emisorTipoId: "01" | "02" | "03" | "04";
  emisorNumeroId: string;
}

export class TribuCRProvider implements IHaciendaProvider {
  constructor(private readonly config: TribuCRConfig) {}

  async enviarComprobante(input: EnviarComprobanteInput): Promise<{ error?: string }> {
    const { config } = this;

    let token: string;
    try {
      token = await obtenerToken(config.ambiente, config.usuario, config.clave, config.empresaId);
    } catch (err) {
      return { error: `Auth TRIBU-CR: ${(err as Error).message}` };
    }

    const ep = ENDPOINTS[config.ambiente];
    const payload = {
      clave: input.clave,
      fecha: input.fecha,
      emisor: {
        tipoIdentificacion: input.emisor.tipoIdentificacion,
        numeroIdentificacion: input.emisor.numeroIdentificacion,
      },
      ...(input.receptor && {
        receptor: {
          tipoIdentificacion: input.receptor.tipoIdentificacion,
          numeroIdentificacion: input.receptor.numeroIdentificacion,
        },
      }),
      comprobanteXml: input.xmlFirmadoBase64,
      ...(input.callbackUrl && { callbackUrl: input.callbackUrl }),
    };

    try {
      const res = await fetch(ep.recepcion, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      });

      // 200/201/202 = aceptado para procesamiento
      if (res.status === 200 || res.status === 201 || res.status === 202) {
        return {};
      }

      // 400 = ya fue enviado (clave duplicada) — idempotente, no es error
      if (res.status === 400) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        if (body?.error?.includes("ya fue recibido")) return {};
        return { error: `Rechazo TRIBU-CR (400): ${JSON.stringify(body)}` };
      }

      const text = await res.text().catch(() => "");
      return { error: `TRIBU-CR (${res.status}): ${text}` };
    } catch (err) {
      return { error: `Red TRIBU-CR: ${(err as Error).message}` };
    }
  }

  async consultarEstado(clave: string): Promise<ConsultaEstadoResult> {
    const { config } = this;

    let token: string;
    try {
      token = await obtenerToken(config.ambiente, config.usuario, config.clave, config.empresaId);
    } catch (err) {
      return { clave, estado: "ERROR", mensaje: `Auth: ${(err as Error).message}` };
    }

    const ep = ENDPOINTS[config.ambiente];

    try {
      const res = await fetch(`${ep.recepcion}/${clave}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
      });

      if (res.status === 404) {
        return { clave, estado: "EN_PROCESO", mensaje: "Comprobante no encontrado aún" };
      }

      if (!res.ok) {
        return { clave, estado: "ERROR", mensaje: `HTTP ${res.status}` };
      }

      const json = await res.json() as {
        ind_estado?: string;
        respuesta_xml?: string;
        mensaje_hacienda?: { detalle?: string; mensaje?: string };
      };

      const estado = mapearEstadoMH(json.ind_estado);
      return {
        clave,
        estado,
        mensaje: json.mensaje_hacienda?.mensaje,
        detalleMensaje: json.mensaje_hacienda?.detalle,
        respuestaXmlBase64: json.respuesta_xml,
      };
    } catch (err) {
      return { clave, estado: "ERROR", mensaje: (err as Error).message };
    }
  }
}

function mapearEstadoMH(indEstado?: string): EstadoMH {
  switch (indEstado?.toUpperCase()) {
    case "ACEPTADO": return "ACEPTADO";
    case "RECHAZADO": return "RECHAZADO";
    case "EN_PROCESO": return "EN_PROCESO";
    default: return "EN_PROCESO";
  }
}

// ─── Singleton por empresa (sin reconectar en cada request) ───────────────────

const providerCache = new Map<string, TribuCRProvider>();

export function getHaciendaProvider(config: TribuCRConfig): TribuCRProvider {
  const key = `${config.empresaId}:${config.ambiente}`;
  let provider = providerCache.get(key);
  if (!provider) {
    provider = new TribuCRProvider(config);
    providerCache.set(key, provider);
  }
  return provider;
}
