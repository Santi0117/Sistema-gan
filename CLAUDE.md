# SistemaGan — Sistema de Facturación Electrónica (Costa Rica)

> Este archivo es el contexto maestro del proyecto. Claude Code debe leerlo antes de cada tarea.
> Empresa: distribuidora ganadera + tienda (lácteos y afines). Multi-usuario, multi-ruta.

---

## ⚠️ CONTEXTO CRÍTICO — Hacienda Costa Rica 2026

El sistema DEBE cumplir con la normativa **vigente a 2026**, NO con versiones viejas:

- **Versión de comprobantes: 4.4** (obligatoria desde 1 sept 2025). La versión 4.3 está obsoleta.
- **Plataforma: TRIBU-CR** (reemplazó a ATV el 6 oct 2025). Hacienda Digital.
- **Validación API:** `https://api.hacienda.go.cr` para consultas (contribuyentes, CABYS, tipo de cambio, exoneraciones). **Implementar caché local obligatorio** — Hacienda penaliza consultas repetitivas.
- **Firma:** llave criptográfica `.p12` (PKCS#12) que el contribuyente descarga de la OVi. Vigencia 4 años.
- **Clave numérica:** 50 dígitos. Incluye país (506), fecha, identificación, consecutivo (20), situación (1), código de seguridad (8).

### Tipos de comprobante 4.4 (código en clave numérica)
- `01` Factura Electrónica (FE)
- `04` Tiquete Electrónico (TE)
- `02` Nota de Débito
- `03` Nota de Crédito
- `08` Factura Electrónica de Compra (FEC) — para servicios/intangibles del exterior
- `09` Factura Electrónica de Exportación
- `10` Recibo Electrónico de Pago (REP) — NUEVO en 4.4. Obligatorio en ventas a crédito con IVA diferido y ventas a entidades públicas. Reporta IVA al cobrar, no al emitir.

### Campos NUEVOS obligatorios en 4.4 (no olvidar)
- **Código CABYS por línea** (catálogo 2025) — obligatorio en cada ítem.
- **Código de actividad económica del receptor** (CIIU 4) — opcional en FE/TE, obligatorio en FEC.
- **Medios de pago ampliados:** efectivo, tarjeta, SINPE Móvil, plataforma digital (PayPal), transferencia. El medio de pago va en el RESUMEN del XML, no en el encabezado.
- **Clasificación IVA detallada:** incluye código 11 (tarifa 0% sin derecho a crédito).
- **Hasta 4 correos** vinculables a emisor/receptor.
- **Detalle individual de combos:** cada componente con su CABYS propio.
- **Exoneraciones:** institución, porcentaje, artículo legal.
- **Teléfono:** solo numérico, 8–20 dígitos.
- **Identificación del proveedor de sistemas** (cédula jurídica de quien hace el software).
- Soportar **cédula jurídica alfanumérica** (formato nuevo, obligatorio nov 2026).

### Flujo de emisión electrónica
```
1. Construir objeto factura (validar CABYS, IVA, totales)
2. Generar consecutivo y clave numérica (50 díg)
3. Construir XML según XSD v4.4
4. Validar XML contra XSD localmente ANTES de firmar
5. Firmar XML con .p12 (XAdES-BES)
6. Autenticarse en TRIBU-CR (OAuth/token con usuario+clave de la OVi)
7. POST a recepción de Hacienda
8. Poll del estado: aceptado / rechazado / procesando
9. Guardar XML firmado + respuesta MH
10. Enviar XML + PDF al correo del cliente
```

**IMPORTANTE:** Implementar primero en **ambiente de PRUEBAS (sandbox)** de Hacienda. No tocar producción sin certificado real y pruebas pasadas. Abstraer la integración detrás de una interfaz `IHaciendaProvider` para poder cambiar entre sandbox/producción y, si hace falta, delegar en un proveedor certificado (ej. un PAC) sin reescribir el dominio.

---

## 🛠️ Stack tecnológico (moderno, 2026)

- **Framework:** Next.js 15 (App Router, React Server Components, Server Actions) + TypeScript estricto
- **Estilos:** Tailwind CSS v4 + shadcn/ui
- **Base de datos:** PostgreSQL 16
- **ORM:** Drizzle ORM (type-safe, performante, migraciones SQL claras) — o Prisma si se prefiere DX sobre control
- **Auth:** Better Auth (sesiones, roles, 2FA) — alternativa a NextAuth/Auth.js
- **Validación:** Zod (compartida entre cliente y servidor)
- **Estado servidor/fetching:** TanStack Query donde haga falta cliente; Server Actions para mutaciones
- **Tablas/datos:** TanStack Table
- **Formularios:** React Hook Form + Zod resolver
- **XML:** `fast-xml-parser` para build/parse; `xadesjs` + `@peculiar/x509` para firma XAdES-BES con .p12
- **PDF / tiquete:** `@react-pdf/renderer` (PDF) + plantilla CSS `@media print` 80mm para impresión térmica
- **Excel:** `exceljs` o SheetJS para exportar reportes
- **Jobs/colas:** para reintentos de envío a Hacienda usar una cola simple (BullMQ + Redis) o un job table con cron; debe ser idempotente
- **Fechas:** `date-fns` con timezone `America/Costa_Rica`
- **Dinero:** NUNCA usar floats para cálculos fiscales. Usar enteros (céntimos) o `decimal.js`. Redondeo según reglas de Hacienda (5 decimales internos, 2 en presentación).
- **Tests:** Vitest (unit) + Playwright (e2e). Tests obligatorios para: cálculo de IVA, generación de clave numérica, construcción de XML, redondeos.
- **Lint/format:** Biome (rápido) o ESLint + Prettier
- **Deploy:** Docker + Docker Compose (app + postgres + redis). Variables en `.env`.

---

## 📐 Principios de arquitectura

1. **Separación de capas:** `domain` (lógica de negocio pura, sin framework) / `infrastructure` (DB, Hacienda, email) / `app` (UI, rutas).
2. **El dominio fiscal es sagrado:** cálculos de IVA, totales y clave numérica viven en funciones puras, 100% testeadas, sin dependencias de DB ni UI.
3. **Type-safety de punta a punta:** Zod valida en el borde, Drizzle tipa la DB, TS estricto en todo.
4. **Server Actions** para mutaciones; nada de exponer lógica fiscal en el cliente.
5. **Idempotencia** en todo lo que toca Hacienda (no emitir doble, no enviar doble a MH).
6. **Auditoría:** toda emisión, anulación y envío a MH se registra en una tabla `audit_log` con usuario, timestamp y payload.
7. **Multi-tenant ligero:** todo cuelga de `empresaId` por si en el futuro se agregan más empresas.

---

## 📂 Estructura de carpetas objetivo

```
/src
  /app
    /(auth)/login
    /(dashboard)
      layout.tsx          ← sidebar + topbar
      page.tsx            ← dashboard
      /ventas
        page.tsx          ← comprobantes (lista + filtros)
        /nueva            ← punto de venta / nueva factura
        /[id]             ← detalle
      /compras
      /clientes
        page.tsx
        /nuevo            ← wizard 3 pasos
        /[id]
      /productos
        page.tsx
        /nuevo
        /[id]
      /inventario
        page.tsx
        /movimientos
      /rutas
        page.tsx
        /nueva            ← wizard 4 pasos
        /[id]
      /reportes
        /[tipo]           ← 10 reportes
      /configuracion
        /empresa          ← datos fiscales, llave .p12, credenciales TRIBU-CR
        /usuarios
  /domain
    /facturacion
      calcular-totales.ts     ← IVA, descuentos, totales (PURO, testeado)
      clave-numerica.ts       ← genera clave 50 díg (PURO, testeado)
      consecutivo.ts
      tipos.ts
    /hacienda
      construir-xml.ts        ← XML v4.4 desde objeto factura
      firmar-xml.ts           ← XAdES-BES con .p12
      validar-xsd.ts
      cabys.ts                ← validación/caché CABYS
    /inventario
    /rutas
  /infrastructure
    /db
      schema.ts               ← Drizzle schema
      index.ts
      migrations/
    /hacienda
      provider.interface.ts   ← IHaciendaProvider
      tribu-cr.provider.ts    ← impl real (sandbox + prod)
      hacienda-api.ts         ← consultas con caché (contribuyente, tipo cambio)
    /email
    /pdf
  /components
    /ui                       ← shadcn
    /layout
    /facturas
    /clientes
    /rutas
  /lib
    auth.ts
    zod-schemas.ts
    money.ts                  ← helpers de dinero (sin floats)
    dates.ts
/tests
  /unit
  /e2e
```

---

## 🎨 Guía visual

- **Color primario:** naranja `#E85D24` (acentos, botones primarios, item activo del menú)
- **Sidebar:** fondo oscuro `#1e2130`, texto blanco translúcido, item activo con borde izquierdo naranja
- **Tono general:** limpio, plano, profesional. shadcn/ui por defecto.
- **Badges de estado:** verde (activo/aceptado MH), naranja (pendiente MH), rojo (rechazado/crédito vencido), gris (no aplica).
- **Idioma:** todo en español (Costa Rica). Moneda ₡ (CRC) con opción USD. Formato de fecha DD/MM/YYYY.
- **Mobile-first responsive:** el sistema se usa en tablets en ruta. La nueva factura debe funcionar bien en pantalla táctil.

---

## ✅ Reglas para Claude Code al trabajar en este repo

- Ejecuta `pnpm typecheck` y `pnpm test` antes de dar por terminada cualquier tarea.
- Cualquier función de cálculo fiscal nueva DEBE venir con su test.
- No inventes campos de Hacienda: si no estás seguro de un campo del XML 4.4, deja un TODO y consulta los XSD oficiales en `https://atv.hacienda.go.cr/.../v4.4/`.
- No uses floats para dinero. Nunca.
- Commits pequeños y descriptivos por feature.
- Mantén el dominio sin imports de Next.js, React ni Drizzle.
