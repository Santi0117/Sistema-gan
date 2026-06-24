/**
 * Cola BullMQ para envío idempotente de comprobantes a Hacienda.
 * Worker: construye XML → valida → firma → envía → actualiza estadoMH en DB.
 * Reintentos exponenciales. Idempotencia por clave numérica.
 */

import { Queue, Worker, type Job } from "bullmq";
import { construirXML, calcularTotalesXML, tipoPagoAMedioPago, tipoPagoACondicionVenta, tipoIdAHacienda } from "@/domain/hacienda/construir-xml";
import { validarXML } from "@/domain/hacienda/validar-xsd";
import { firmarXML } from "@/domain/hacienda/firmar-xml";
import { getHaciendaProvider } from "./tribu-cr.provider";
import type { TipoImpuesto } from "@/domain/facturacion/tipos";

// ─── Job payload ──────────────────────────────────────────────────────────────

export interface EnviarComprobanteJob {
  facturaId: string;
  empresaId: string;
}

// ─── Redis connection ─────────────────────────────────────────────────────────

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

// Parsear la URL en opciones de conexión que BullMQ acepta internamente,
// evitando conflictos entre versiones de ioredis (BullMQ bundlea la suya).
function getRedisConnectionOptions() {
  try {
    const u = new URL(REDIS_URL);
    return {
      host: u.hostname || "localhost",
      port: parseInt(u.port || "6379"),
      password: u.password || undefined,
      maxRetriesPerRequest: null as null, // requerido por BullMQ
    };
  } catch {
    return { host: "localhost", port: 6379, maxRetriesPerRequest: null as null };
  }
}

// ─── Queue ────────────────────────────────────────────────────────────────────

export const QUEUE_NAME = "hacienda-envio";

let queueInstance: Queue<EnviarComprobanteJob> | null = null;

export function getHaciendaQueue(): Queue<EnviarComprobanteJob> {
  if (!queueInstance) {
    queueInstance = new Queue<EnviarComprobanteJob>(QUEUE_NAME, {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 10_000 }, // 10s, 20s, 40s, 80s, 160s
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    });
  }
  return queueInstance!;
}

/**
 * Encola una factura para envío a Hacienda.
 * Idempotente: si ya existe un job con el mismo facturaId, no duplica.
 */
export async function encolarEnvioHacienda(facturaId: string, empresaId: string): Promise<void> {
  const queue = getHaciendaQueue();
  await queue.add(
    "enviar",
    { facturaId, empresaId },
    {
      jobId: `factura:${facturaId}`, // idempotencia por facturaId
    }
  );
}

// ─── Worker ───────────────────────────────────────────────────────────────────

/**
 * Inicia el worker de Hacienda.
 * Llamar solo en el proceso worker (no en Next.js app server).
 * Ver: /scripts/worker.ts
 */
export function iniciarWorkerHacienda(): Worker<EnviarComprobanteJob> {
  const connection = getRedisConnectionOptions();

  const worker = new Worker<EnviarComprobanteJob>(
    QUEUE_NAME,
    async (job: Job<EnviarComprobanteJob>) => {
      const { facturaId, empresaId } = job.data;
      await procesarEnvioHacienda(facturaId, empresaId, job);
    },
    {
      connection,
      concurrency: 3,
    }
  );

  worker.on("completed", (job) => {
    console.info(`[Hacienda] Factura ${job.data.facturaId} enviada exitosamente`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Hacienda] Factura ${job?.data.facturaId} falló: ${err.message}`);
  });

  return worker;
}

// ─── Procesador del job ───────────────────────────────────────────────────────

async function procesarEnvioHacienda(
  facturaId: string,
  empresaId: string,
  job: Job
): Promise<void> {
  // Importación dinámica para evitar cargar Drizzle en el proceso Next.js
  const { db, factura, lineaFactura, empresa } = await import("@/infrastructure/db");
  const { eq, and } = await import("drizzle-orm");

  // Cargar factura
  const [f] = await db
    .select()
    .from(factura)
    .where(and(eq(factura.id, facturaId), eq(factura.empresaId, empresaId)));

  if (!f) throw new Error(`Factura ${facturaId} no encontrada`);

  // Idempotencia: si ya fue aceptada o está en proceso, no reenviar
  if (f.estadoMH === "ACEPTADA" || f.estadoMH === "EN_PROCESO") {
    console.info(`[Hacienda] Factura ${facturaId} ya tiene estado ${f.estadoMH}, omitiendo`);
    return;
  }
  if (!f.claveNumerica || !f.consecutivo) {
    throw new Error(`Factura ${facturaId} no tiene clave/consecutivo electrónico`);
  }

  await job.updateProgress(10);

  // Cargar empresa
  const [emp] = await db.select().from(empresa).where(eq(empresa.id, empresaId));
  if (!emp) throw new Error(`Empresa ${empresaId} no encontrada`);
  if (!emp.usuarioTribuCR || !emp.claveTribuCR) {
    throw new Error("Empresa sin credenciales TRIBU-CR configuradas");
  }
  if (!emp.certificadoP12 || !emp.pinCertificado) {
    throw new Error("Empresa sin certificado .p12 configurado");
  }

  // Cargar líneas
  const lineas = await db
    .select()
    .from(lineaFactura)
    .where(eq(lineaFactura.facturaId, facturaId));

  await job.updateProgress(20);

  // Descifrar credenciales (AES-256 — ver descifrarCredencial)
  const usuarioCR = await descifrarCredencial(emp.usuarioTribuCR);
  const claveCR = await descifrarCredencial(emp.claveTribuCR);
  const p12Buffer = Buffer.from(await descifrarCredencial(emp.certificadoP12), "base64");
  const pinCert = await descifrarCredencial(emp.pinCertificado);

  // Construir XML
  const tipoIdEmisor = tipoIdAHacienda(emp.tipoIdentificacion ?? "JURIDICA") ?? "02";
  const xmlInput = {
    tipoComprobante: f.tipoComprobante,
    clave: f.claveNumerica,
    consecutivo: f.consecutivo,
    fechaEmision: f.fecha,
    emisor: {
      nombre: emp.nombre,
      tipoIdentificacion: tipoIdEmisor,
      nombreComercial: emp.nombreComercial ?? undefined,
      numeroIdentificacion: emp.identificacion,
      provincia: emp.provincia ?? undefined,
      canton: emp.canton ?? undefined,
      distrito: emp.distrito ?? undefined,
      otrasSenas: emp.direccion ?? undefined,
      correoElectronico: emp.correoFactura ?? emp.correo,
      actividadEconomica: emp.actividadEconomica ?? "0121",
    },
    receptor: f.clienteId ? await cargarReceptor(db, f.clienteId) : undefined,
    condicionVenta: tipoPagoACondicionVenta(f.tipoPago),
    plazoCredito: f.tipoPago === "CREDITO" ? 30 : undefined,
    medioPago: [tipoPagoAMedioPago(f.tipoPago)],
    lineas: lineas.map((l, i) => ({
      numeroLinea: i + 1,
      codigoCabys: l.codigoCabys ?? "9999999999999",
      descripcion: l.descripcion,
      unidadMedida: l.unidadMedida,
      cantidad: new Number(l.cantidad).toFixed(3),
      precioUnitario: l.precioUnitario,
      montoTotal: new Number(Number(l.cantidad) * Number(l.precioUnitario)).toFixed(5),
      descuentoMonto: Number(l.descuentoMonto) > 0 ? l.descuentoMonto : undefined,
      subTotal: l.subtotalLinea,
      baseImponible: l.baseImponible,
      tipoImpuesto: l.tipoImpuesto as TipoImpuesto,
      montoImpuesto: l.montoImpuesto,
      montoTotalLinea: l.totalLinea,
    })),
    moneda: f.moneda as "CRC" | "USD",
    tipoCambio: f.tipoCambio,
    totales: {
      totalServGravados: "0.00000",
      totalServExentos: "0.00000",
      totalServExonerado: "0.00000",
      totalMercanciasGravadas: f.subtotal,
      totalMercanciasExentas: "0.00000",
      totalMercanciasExoneradas: "0.00000",
      totalGravado: f.subtotal,
      totalExento: "0.00000",
      totalExonerado: "0.00000",
      totalVenta: f.subtotal,
      totalDescuentos: f.descuento,
      totalVentaNeta: new Number(Number(f.subtotal) - Number(f.descuento)).toFixed(5),
      totalImpuesto: f.impuesto,
      totalComprobante: f.total,
    },
  };

  const xmlSinFirmar = construirXML(xmlInput);
  await job.updateProgress(40);

  // Validar estructura
  const validacion = validarXML(xmlSinFirmar);
  if (!validacion.valido) {
    throw new Error(`XML inválido: ${validacion.errores.join("; ")}`);
  }

  await job.updateProgress(50);

  // Firmar
  const { xmlFirmado, error: errorFirma } = await firmarXML({
    xmlSinFirmar,
    certificadoP12Buffer: p12Buffer,
    pinCertificado: pinCert,
  });
  if (errorFirma || !xmlFirmado) {
    throw new Error(`Error firmando XML: ${errorFirma}`);
  }

  await job.updateProgress(70);

  // Marcar EN_PROCESO antes de enviar
  await db.update(factura)
    .set({ estadoMH: "EN_PROCESO", xmlFirmado })
    .where(eq(factura.id, facturaId));

  // Enviar a TRIBU-CR
  const provider = getHaciendaProvider({
    usuario: usuarioCR,
    clave: claveCR,
    ambiente: emp.ambienteMH,
    empresaId,
    emisorTipoId: tipoIdEmisor,
    emisorNumeroId: emp.identificacion,
  });

  const xmlBase64 = Buffer.from(xmlFirmado, "utf-8").toString("base64");
  const { error: errorEnvio } = await provider.enviarComprobante({
    clave: f.claveNumerica,
    fecha: f.fecha.toISOString(),
    emisor: { tipoIdentificacion: tipoIdEmisor, numeroIdentificacion: emp.identificacion },
    xmlFirmadoBase64: xmlBase64,
  });

  if (errorEnvio) {
    await db.update(factura)
      .set({ estadoMH: "ERROR", mensajeMH: errorEnvio })
      .where(eq(factura.id, facturaId));
    throw new Error(errorEnvio);
  }

  await job.updateProgress(90);

  // Poll estado (esperar resultado hasta 30s en el mismo job)
  let estadoFinal: "ACEPTADA" | "RECHAZADA" | "EN_PROCESO" = "EN_PROCESO";
  let respuestaMH: string | undefined;
  let mensajeMH: string | undefined;

  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const result = await provider.consultarEstado(f.claveNumerica);
    if (result.estado === "ACEPTADO") {
      estadoFinal = "ACEPTADA";
      respuestaMH = result.respuestaXmlBase64;
      break;
    }
    if (result.estado === "RECHAZADO") {
      estadoFinal = "RECHAZADA";
      mensajeMH = result.detalleMensaje ?? result.mensaje;
      respuestaMH = result.respuestaXmlBase64;
      break;
    }
  }

  // Actualizar estado final
  await db.update(factura)
    .set({
      estadoMH: estadoFinal,
      respuestaMH: respuestaMH ?? null,
      mensajeMH: mensajeMH ?? null,
    })
    .where(eq(factura.id, facturaId));

  await job.updateProgress(100);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function cargarReceptor(db: any, clienteId: string) {
  const { cliente } = await import("@/infrastructure/db");
  const { eq } = await import("drizzle-orm");
  const [c] = await db.select().from(cliente).where(eq(cliente.id, clienteId));
  if (!c) return undefined;
  const tipoId = tipoIdAHacienda(c.tipoIdentificacion);
  return {
    nombre: c.nombre,
    tipoIdentificacion: tipoId,
    numeroIdentificacion: tipoId ? c.identificacion ?? undefined : undefined,
    correoElectronico: c.correoFactura ?? c.correoContacto ?? undefined,
    actividadEconomicaReceptor: c.actividadEconomicaReceptor ?? undefined,
  };
}

/**
 * Descifra una credencial cifrada con AES-256.
 * Las credenciales se cifran al guardar en la página de configuración de empresa.
 *
 * TODO: Implementar cifrado/descifrado con ENCRYPTION_KEY de .env.
 * Por ahora retorna el valor tal cual (funcional solo en desarrollo).
 */
async function descifrarCredencial(valor: string): Promise<string> {
  // TODO: AES-256-GCM decrypt usando process.env.ENCRYPTION_KEY
  return valor;
}
