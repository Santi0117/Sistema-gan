import { z } from "zod";

// ─── Producto ─────────────────────────────────────────────────────────────────

export const TIPOS_IMPUESTO = [
  "EXENTO",
  "IVA_0_SIN_CREDITO",
  "IVA_1",
  "IVA_2",
  "IVA_4",
  "IVA_8",
  "IVA_13",
] as const;

export const TIPOS_IMPUESTO_LABEL: Record<(typeof TIPOS_IMPUESTO)[number], string> = {
  EXENTO: "Exento 0%",
  IVA_0_SIN_CREDITO: "0% sin crédito (Cód. 11)",
  IVA_1: "1% (reducida)",
  IVA_2: "2% (reducida)",
  IVA_4: "4% (servicios de salud)",
  IVA_8: "8% (servicios)",
  IVA_13: "13% (general)",
};

export const UNIDADES_MEDIDA = [
  { value: "Unid", label: "Unidad" },
  { value: "Kg", label: "Kilogramo (Kg)" },
  { value: "g", label: "Gramo (g)" },
  { value: "L", label: "Litro (L)" },
  { value: "mL", label: "Mililitro (mL)" },
  { value: "M", label: "Metro (M)" },
  { value: "M2", label: "Metro cuadrado (M²)" },
  { value: "M3", label: "Metro cúbico (M³)" },
  { value: "Caja", label: "Caja" },
  { value: "Docena", label: "Docena" },
  { value: "Serv", label: "Servicio" },
  { value: "Hr", label: "Hora (Hr)" },
] as const;

const moneyField = (campo: string) =>
  z
    .string()
    .regex(/^\d+(\.\d{1,5})?$/, `${campo} debe ser un número válido`)
    .refine((v) => parseFloat(v) >= 0, `${campo} no puede ser negativo`);

export const productoSchema = z.object({
  codigo: z.string().min(1, "El código es requerido").max(50),
  nombre: z.string().min(1, "El nombre es requerido").max(255),
  descripcion: z.string().max(500).optional(),
  codigoCabys: z
    .string()
    .regex(/^\d{13}$/, "El código CABYS debe tener exactamente 13 dígitos")
    .optional()
    .or(z.literal("")),
  categoria: z.string().max(100).optional(),
  unidadMedida: z.string().min(1).default("Unid"),
  precioCosto: moneyField("Precio costo"),
  precioVenta: moneyField("Precio venta"),
  tipoImpuesto: z.enum(TIPOS_IMPUESTO),
  controlarStock: z.boolean().default(true),
  stockActual: z
    .string()
    .regex(/^\d+(\.\d{1,3})?$/, "Stock debe ser un número válido")
    .default("0"),
  stockMinimo: z
    .string()
    .regex(/^\d+(\.\d{1,3})?$/, "Stock mínimo debe ser un número válido")
    .default("0"),
  activo: z.boolean().default(true),
});

export type ProductoInput = z.infer<typeof productoSchema>;

// ─── Cliente ──────────────────────────────────────────────────────────────────

export const TIPOS_ID_CLIENTE = [
  "FISICA",
  "JURIDICA",
  "DIMEX",
  "NITE",
  "GENERICO",
  "EXTRANJERO_ND",
  "NO_CONTRIBUYENTE",
] as const;

export const TIPOS_ID_CLIENTE_LABEL: Record<(typeof TIPOS_ID_CLIENTE)[number], string> = {
  FISICA: "Cédula física",
  JURIDICA: "Cédula jurídica",
  DIMEX: "DIMEX (residencia)",
  NITE: "NITE",
  GENERICO: "Genérico (consumidor final)",
  EXTRANJERO_ND: "Extranjero no domiciliado",
  NO_CONTRIBUYENTE: "No contribuyente",
};

export const clienteSchema = z.object({
  tipoIdentificacion: z.enum(TIPOS_ID_CLIENTE),
  identificacion: z.string().max(20).optional().or(z.literal("")),
  nombre: z.string().min(1, "El nombre es requerido").max(255),
  nombreNegocio: z.string().max(255).optional().or(z.literal("")),
  codigoNegocio: z.string().max(50).optional().or(z.literal("")),
  responsable: z.string().max(255).optional().or(z.literal("")),
  telefono: z
    .string()
    .regex(/^\d{8,20}$/, "El teléfono debe tener entre 8 y 20 dígitos numéricos")
    .optional()
    .or(z.literal("")),
  actividadEconomicaReceptor: z.string().max(10).optional().or(z.literal("")),
  contribuyente: z.boolean().default(false),
  tieneCredito: z.boolean().default(false),
  diasCredito: z.coerce.number().int().min(0).max(365).default(0),
  limiteCredito: z
    .string()
    .regex(/^\d+(\.\d{1,5})?$/, "Límite de crédito inválido")
    .default("0"),
  activo: z.boolean().default(true),
  // Paso 2
  correoContacto: z.string().email("Correo inválido").optional().or(z.literal("")),
  correoFactura: z.string().email("Correo factura inválido").optional().or(z.literal("")),
  correosAdicionales: z.array(z.string().email()).max(4).default([]),
  pais: z.string().max(50).default("CR"),
  provincia: z.string().max(3).optional().or(z.literal("")),
  canton: z.string().max(5).optional().or(z.literal("")),
  distrito: z.string().max(7).optional().or(z.literal("")),
  direccion: z.string().max(500).optional().or(z.literal("")),
  rutaId: z.string().optional().or(z.literal("")),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
