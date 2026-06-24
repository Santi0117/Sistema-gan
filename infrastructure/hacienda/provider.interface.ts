// IHaciendaProvider — abstracción para sandbox y producción de TRIBU-CR
// Permite cambiar de implementación sin tocar el dominio.

export interface EnviarComprobanteInput {
  clave: string; // 50 dígitos
  fecha: string; // ISO 8601
  emisor: {
    tipoIdentificacion: "01" | "02" | "03" | "04";
    numeroIdentificacion: string;
  };
  receptor?: {
    tipoIdentificacion: "01" | "02" | "03" | "04";
    numeroIdentificacion: string;
  };
  xmlFirmadoBase64: string;
  callbackUrl?: string;
}

export type EstadoMH =
  | "ACEPTADO"
  | "RECHAZADO"
  | "EN_PROCESO"
  | "ERROR";

export interface ConsultaEstadoResult {
  clave: string;
  estado: EstadoMH;
  mensaje?: string;
  detalleMensaje?: string;
  respuestaXmlBase64?: string;
}

export interface IHaciendaProvider {
  enviarComprobante(input: EnviarComprobanteInput): Promise<{ error?: string }>;
  consultarEstado(clave: string): Promise<ConsultaEstadoResult>;
}
