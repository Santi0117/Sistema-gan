import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  json,
  pgEnum,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Helpers internos ────────────────────────────────────────────────────────

const id = () =>
  text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`);

/** Dinero con 5 decimales de precisión interna (norma Hacienda) */
const money = (name: string) => numeric(name, { precision: 19, scale: 5 });

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

// ─── Enums PostgreSQL ────────────────────────────────────────────────────────

export const rolUsuarioEnum = pgEnum("rol_usuario", ["ADMIN", "VENDEDOR", "CONTADOR"]);

export const tipoIdEmpresaEnum = pgEnum("tipo_id_empresa", [
  "FISICA",
  "JURIDICA",
  "DIMEX",
  "NITE",
  "EXTRANJERO",
]);

export const tipoIdClienteEnum = pgEnum("tipo_id_cliente", [
  "FISICA",
  "JURIDICA",
  "DIMEX",
  "NITE",
  "GENERICO",
  "EXTRANJERO_ND",
  "NO_CONTRIBUYENTE",
]);

export const tipoImpuestoEnum = pgEnum("tipo_impuesto", [
  "EXENTO",
  "IVA_0_SIN_CREDITO",
  "IVA_1",
  "IVA_2",
  "IVA_4",
  "IVA_8",
  "IVA_13",
]);

export const tipoComprobanteEnum = pgEnum("tipo_comprobante", [
  "FE",
  "ND",
  "NC",
  "TE",
  "FEC",
  "FEE",
  "REP",
  "NORMAL",
]);

export const tipoPagoEnum = pgEnum("tipo_pago", [
  "CONTADO",
  "CREDITO",
  "TRANSFERENCIA",
  "SINPE_MOVIL",
  "TARJETA",
  "PLATAFORMA_DIGITAL",
]);

export const estadoFacturaEnum = pgEnum("estado_factura", ["ACTIVA", "ANULADA", "PAGADA"]);

export const estadoMHEnum = pgEnum("estado_mh", [
  "NO_APLICA",
  "PENDIENTE",
  "EN_PROCESO",
  "ACEPTADA",
  "RECHAZADA",
  "ERROR",
]);

export const ambienteMHEnum = pgEnum("ambiente_mh", ["PRUEBAS", "PRODUCCION"]);

export const tipoMovimientoEnum = pgEnum("tipo_movimiento_inventario", [
  "ENTRADA",
  "SALIDA",
  "AJUSTE",
  "VENTA",
]);

// ─── Tabla: empresa ──────────────────────────────────────────────────────────

export const empresa = pgTable("empresa", {
  id: id(),
  nombre: text("nombre").notNull(),
  nombreComercial: text("nombre_comercial"),
  identificacion: varchar("identificacion", { length: 20 }).notNull().unique(),
  tipoIdentificacion: tipoIdEmpresaEnum("tipo_identificacion").notNull(),
  actividadEconomica: varchar("actividad_economica", { length: 20 }), // CIIU4
  correo: text("correo").notNull(),
  correosAdicionales: json("correos_adicionales").$type<string[]>(),
  correoFactura: text("correo_factura"),
  telefono: varchar("telefono", { length: 20 }),
  provincia: varchar("provincia", { length: 2 }),
  canton: varchar("canton", { length: 4 }),
  distrito: varchar("distrito", { length: 6 }),
  direccion: text("direccion"),
  // Credenciales almacenadas cifradas en reposo (AES-256)
  usuarioTribuCR: text("usuario_tribu_cr"),
  claveTribuCR: text("clave_tribu_cr"),
  certificadoP12: text("certificado_p12"),  // base64 cifrado
  pinCertificado: text("pin_certificado"),
  ambienteMH: ambienteMHEnum("ambiente_mh").default("PRUEBAS").notNull(),
  proveedorSistemasId: varchar("proveedor_sistemas_id", { length: 20 }),
  // { "FE": 1250, "TE": 43, ... } — próxima secuencia por tipo de comprobante
  consecutivos: json("consecutivos").$type<Record<string, number>>(),
  ...timestamps,
});

// ─── Tabla: usuario ──────────────────────────────────────────────────────────

export const usuario = pgTable("usuario", {
  id: id(),
  nombre: text("nombre").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  rol: rolUsuarioEnum("rol").notNull().default("VENDEDOR"),
  activo: boolean("activo").notNull().default(true),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  empresaId: text("empresa_id")
    .notNull()
    .references(() => empresa.id),
  ...timestamps,
});

// ─── Tabla: ruta ─────────────────────────────────────────────────────────────

export const ruta = pgTable("ruta", {
  id: id(),
  nombre: text("nombre").notNull(),
  codigo: varchar("codigo", { length: 20 }).notNull(),
  dias: json("dias").$type<string[]>(), // e.g. ["lunes","viernes"]
  responsableId: text("responsable_id").references(() => usuario.id),
  vehiculo: text("vehiculo"),
  notas: text("notas"),
  activa: boolean("activa").notNull().default(true),
  empresaId: text("empresa_id")
    .notNull()
    .references(() => empresa.id),
  ...timestamps,
});

// ─── Tabla: cliente ──────────────────────────────────────────────────────────

export const cliente = pgTable(
  "cliente",
  {
    id: id(),
    tipoIdentificacion: tipoIdClienteEnum("tipo_identificacion").notNull(),
    identificacion: varchar("identificacion", { length: 20 }),
    nombre: text("nombre").notNull(),
    nombreNegocio: text("nombre_negocio"),
    codigoNegocio: varchar("codigo_negocio", { length: 20 }),
    responsable: text("responsable"),
    telefono: varchar("telefono", { length: 20 }),
    correoContacto: text("correo_contacto"),
    correosAdicionales: json("correos_adicionales").$type<string[]>(),
    correoFactura: text("correo_factura"),
    actividadEconomicaReceptor: varchar("actividad_economica_receptor", { length: 20 }),
    pais: varchar("pais", { length: 3 }).default("CR").notNull(),
    provincia: varchar("provincia", { length: 2 }),
    canton: varchar("canton", { length: 4 }),
    distrito: varchar("distrito", { length: 6 }),
    direccion: text("direccion"),
    tieneCredito: boolean("tiene_credito").notNull().default(false),
    diasCredito: integer("dias_credito").default(0),
    limiteCredito: money("limite_credito"),
    contribuyente: boolean("contribuyente").notNull().default(true),
    activo: boolean("activo").notNull().default(true),
    empresaId: text("empresa_id")
      .notNull()
      .references(() => empresa.id),
    rutaId: text("ruta_id").references(() => ruta.id),
    ordenEnRuta: integer("orden_en_ruta"),
    ...timestamps,
  },
  (t) => [
    index("idx_cliente_empresa").on(t.empresaId),
    index("idx_cliente_ruta").on(t.rutaId),
    index("idx_cliente_identificacion").on(t.empresaId, t.identificacion),
  ]
);

// ─── Tabla: producto ─────────────────────────────────────────────────────────

export const producto = pgTable(
  "producto",
  {
    id: id(),
    codigo: varchar("codigo", { length: 50 }).notNull(),
    nombre: text("nombre").notNull(),
    codigoCabys: varchar("codigo_cabys", { length: 13 }), // obligatorio en XML v4.4
    categoria: text("categoria"),
    descripcion: text("descripcion"),
    unidadMedida: varchar("unidad_medida", { length: 10 }).notNull().default("Unid"),
    precioCosto: money("precio_costo").notNull().default("0"),
    precioVenta: money("precio_venta").notNull().default("0"),
    tipoImpuesto: tipoImpuestoEnum("tipo_impuesto").notNull().default("IVA_13"),
    controlarStock: boolean("controlar_stock").notNull().default(true),
    stockActual: numeric("stock_actual", { precision: 19, scale: 3 }).notNull().default("0"),
    stockMinimo: numeric("stock_minimo", { precision: 19, scale: 3 }).notNull().default("0"),
    activo: boolean("activo").notNull().default(true),
    empresaId: text("empresa_id")
      .notNull()
      .references(() => empresa.id),
    ...timestamps,
  },
  (t) => [
    index("idx_producto_empresa").on(t.empresaId),
    index("idx_producto_codigo").on(t.empresaId, t.codigo),
    index("idx_producto_cabys").on(t.codigoCabys),
  ]
);

// ─── Tabla: factura ──────────────────────────────────────────────────────────

export const factura = pgTable(
  "factura",
  {
    id: id(),
    numero: integer("numero").notNull(),
    consecutivo: varchar("consecutivo", { length: 20 }).notNull(),
    claveNumerica: varchar("clave_numerica", { length: 50 }).unique(),
    tipoComprobante: tipoComprobanteEnum("tipo_comprobante").notNull().default("FE"),
    tipoPago: tipoPagoEnum("tipo_pago").notNull().default("CONTADO"),
    medioPagoCodigo: varchar("medio_pago_codigo", { length: 10 }),
    moneda: varchar("moneda", { length: 3 }).notNull().default("CRC"),
    tipoCambio: money("tipo_cambio").notNull().default("1"),
    fecha: timestamp("fecha", { withTimezone: true }).notNull(),
    subtotal: money("subtotal").notNull(),
    descuento: money("descuento").notNull().default("0"),
    impuesto: money("impuesto").notNull().default("0"),
    total: money("total").notNull(),
    estado: estadoFacturaEnum("estado").notNull().default("ACTIVA"),
    estadoMH: estadoMHEnum("estado_mh").notNull().default("NO_APLICA"),
    xmlFirmado: text("xml_firmado"),
    respuestaMH: text("respuesta_mh"),
    mensajeMH: text("mensaje_mh"),
    clienteId: text("cliente_id").references(() => cliente.id),
    rutaId: text("ruta_id").references(() => ruta.id),
    usuarioId: text("usuario_id").references(() => usuario.id),
    empresaId: text("empresa_id")
      .notNull()
      .references(() => empresa.id),
    facturaReferenciaId: text("factura_referencia_id"), // auto-referencia para NC/ND/REP
    ...timestamps,
  },
  (t) => [
    index("idx_factura_empresa").on(t.empresaId),
    index("idx_factura_cliente").on(t.clienteId),
    index("idx_factura_fecha").on(t.fecha),
    index("idx_factura_estado_mh").on(t.estadoMH),
    index("idx_factura_clave").on(t.claveNumerica),
  ]
);

// ─── Tabla: linea_factura ────────────────────────────────────────────────────

export const lineaFactura = pgTable("linea_factura", {
  id: id(),
  facturaId: text("factura_id")
    .notNull()
    .references(() => factura.id, { onDelete: "cascade" }),
  linea: integer("linea").notNull(),
  productoId: text("producto_id").references(() => producto.id),
  codigoCabys: varchar("codigo_cabys", { length: 13 }),
  descripcion: text("descripcion").notNull(),
  unidadMedida: varchar("unidad_medida", { length: 10 }).notNull().default("Unid"),
  cantidad: numeric("cantidad", { precision: 19, scale: 5 }).notNull(),
  precioUnitario: money("precio_unitario").notNull(),
  descuentoPct: numeric("descuento_pct", { precision: 7, scale: 4 }).notNull().default("0"),
  descuentoMonto: money("descuento_monto").notNull().default("0"),
  subtotalLinea: money("subtotal_linea").notNull(),
  baseImponible: money("base_imponible").notNull(),
  tipoImpuesto: tipoImpuestoEnum("tipo_impuesto").notNull(),
  tarifaImpuesto: numeric("tarifa_impuesto", { precision: 7, scale: 4 }).notNull().default("0"),
  montoImpuesto: money("monto_impuesto").notNull().default("0"),
  totalLinea: money("total_linea").notNull(),
  exoneracion: json("exoneracion").$type<{
    institucion: string;
    porcentaje: number;
    articulo: string;
  } | null>(),
});

// ─── Tabla: ruta ─────────────────────────────────────────────────────────────
// (ya definida arriba)

// ─── Tabla: movimiento_inventario ────────────────────────────────────────────

export const movimientoInventario = pgTable(
  "movimiento_inventario",
  {
    id: id(),
    productoId: text("producto_id")
      .notNull()
      .references(() => producto.id),
    tipo: tipoMovimientoEnum("tipo").notNull(),
    cantidad: numeric("cantidad", { precision: 19, scale: 3 }).notNull(),
    costo: money("costo"),
    referencia: text("referencia"),
    facturaId: text("factura_id").references(() => factura.id),
    notas: text("notas"),
    usuarioId: text("usuario_id").references(() => usuario.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_mov_producto").on(t.productoId),
    index("idx_mov_factura").on(t.facturaId),
  ]
);

// ─── Tabla: descuento_cliente ────────────────────────────────────────────────

export const descuentoCliente = pgTable("descuento_cliente", {
  id: id(),
  clienteId: text("cliente_id")
    .notNull()
    .references(() => cliente.id, { onDelete: "cascade" }),
  // null = descuento general para todos los productos de ese cliente
  productoId: text("producto_id").references(() => producto.id, { onDelete: "cascade" }),
  descuentoPct: numeric("descuento_pct", { precision: 7, scale: 4 }).notNull(),
});

// ─── Tabla: audit_log ────────────────────────────────────────────────────────

export const auditLog = pgTable(
  "audit_log",
  {
    id: id(),
    usuarioId: text("usuario_id").references(() => usuario.id),
    empresaId: text("empresa_id").references(() => empresa.id),
    accion: varchar("accion", { length: 100 }).notNull(),
    entidad: varchar("entidad", { length: 50 }).notNull(),
    entidadId: text("entidad_id"),
    payload: json("payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_audit_empresa").on(t.empresaId),
    index("idx_audit_entidad").on(t.entidad, t.entidadId),
    index("idx_audit_created").on(t.createdAt),
  ]
);

// ─── Tipos inferidos ─────────────────────────────────────────────────────────

export type Empresa = typeof empresa.$inferSelect;
export type NuevaEmpresa = typeof empresa.$inferInsert;
export type Usuario = typeof usuario.$inferSelect;
export type NuevoUsuario = typeof usuario.$inferInsert;
export type Cliente = typeof cliente.$inferSelect;
export type NuevoCliente = typeof cliente.$inferInsert;
export type Producto = typeof producto.$inferSelect;
export type NuevoProducto = typeof producto.$inferInsert;
export type Factura = typeof factura.$inferSelect;
export type NuevaFactura = typeof factura.$inferInsert;
export type LineaFactura = typeof lineaFactura.$inferSelect;
export type NuevaLineaFactura = typeof lineaFactura.$inferInsert;
export type Ruta = typeof ruta.$inferSelect;
export type NuevaRuta = typeof ruta.$inferInsert;
export type MovimientoInventario = typeof movimientoInventario.$inferSelect;
export type NuevoMovimientoInventario = typeof movimientoInventario.$inferInsert;
export type DescuentoCliente = typeof descuentoCliente.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
