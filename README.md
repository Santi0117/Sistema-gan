# SistemaGan

Sistema de facturación electrónica para empresa ganadera en Costa Rica. Cumple con la normativa **v4.4 de Hacienda** (TRIBU-CR, vigente desde sept 2025).

## Funcionalidades

- **Facturación electrónica** — FE, TE, NC, ND, FEC, REP con firma XAdES-BES y envío a TRIBU-CR
- **Punto de venta** — búsqueda de clientes y productos, cálculo de IVA en tiempo real
- **Clientes** — wizard 3 pasos, validación de cédula contra Hacienda, crédito
- **Inventario** — stock, movimientos, alertas de stock bajo
- **Rutas** — wizard 4 pasos, asignación de clientes con drag & drop
- **Reportes** — 10 reportes con filtros, exportar Excel, imprimir (incluyendo D-150 IVA para TRIBU-CR)
- **Dashboard** — métricas del mes, alertas de stock/MH/créditos

## Requisitos

- Node.js 22+
- pnpm 11+
- Docker + Docker Compose (para PostgreSQL 16 y Redis 7)

## Inicio rápido (desarrollo sin Docker)

```bash
# 1. Clonar e instalar dependencias
git clone <repo>
cd sistema-gan
pnpm install

# 2. Variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores (ver sección Variables de entorno)

# 3. Levantar servicios (PostgreSQL + Redis)
docker compose up postgres redis -d

# 4. Aplicar schema de base de datos
pnpm db:push

# 5. Levantar servidor de desarrollo
pnpm dev
```

Abrir http://localhost:3000 — credenciales de desarrollo: `admin@sistemagan.cr` / `admin123`

> **Modo sin DB:** el sistema funciona sin PostgreSQL con datos mock para desarrollo/demostración.
> Todas las server actions hacen `try { DB } catch { return MOCK_DATA }`.

## Inicio con Docker (stack completo)

```bash
cp .env.example .env.local
# Editar .env.local con AUTH_SECRET y ENCRYPTION_KEY seguros

docker compose up --build
```

La app queda disponible en http://localhost:3000.

## Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí (con DB) | URL de conexión a PostgreSQL |
| `AUTH_SECRET` | Sí | Secreto para cifrar sesiones iron-session (mínimo 32 chars) |
| `REDIS_URL` | Sí (colas MH) | URL de Redis para la cola de envíos a Hacienda |
| `HACIENDA_AMBIENTE` | Sí | `PRUEBAS` o `PRODUCCION` |
| `HACIENDA_API_URL` | No | URL API pública Hacienda (default: `https://api.hacienda.go.cr`) |
| `TRIBU_CR_URL` | No | URL TRIBU-CR (default: plataforma de producción) |
| `ENCRYPTION_KEY` | Sí (prod) | Clave hex de 64 chars para cifrar credenciales TRIBU-CR y `.p12` |
| `PROVEEDOR_SISTEMAS_ID` | Sí (prod) | Cédula jurídica del proveedor del software (campo obligatorio XML v4.4) |

## Scripts disponibles

```bash
pnpm dev            # Servidor de desarrollo (Next.js)
pnpm build          # Build de producción
pnpm start          # Iniciar servidor de producción
pnpm typecheck      # Verificación de tipos TypeScript
pnpm test           # Tests unitarios (Vitest)
pnpm test:watch     # Tests en modo watch
pnpm test:coverage  # Tests con reporte de cobertura
pnpm test:e2e       # Tests e2e (Playwright) — requiere servidor en puerto 3000
pnpm db:push        # Sincronizar schema Drizzle con la DB (desarrollo)
pnpm db:migrate     # Aplicar migraciones SQL (producción)
pnpm db:studio      # Drizzle Studio (explorador visual de DB)
pnpm lint           # Lint con Biome
pnpm lint:fix       # Lint con corrección automática
pnpm format         # Formatear código con Biome
```

## Tests e2e (Playwright)

Los tests e2e en `tests/e2e/` cubren los flujos críticos:

- **`auth.spec.ts`** — login, redirección, error con credenciales inválidas
- **`dashboard.spec.ts`** — KPIs, alertas, acciones rápidas, navegación
- **`ventas.spec.ts`** — lista de comprobantes, nueva factura, detalle
- **`clientes.spec.ts`** — lista, búsqueda, wizard nuevo cliente, productos
- **`reportes.spec.ts`** — índice de 10 reportes, carga individual, exportar

```bash
# Con servidor ya corriendo en :3000
pnpm test:e2e

# Ver reporte HTML
npx playwright show-report
```

## Configuración de Hacienda (TRIBU-CR)

> Empezar siempre en ambiente de **PRUEBAS** antes de pasar a producción.

1. Obtener credenciales sandbox de TRIBU-CR desde la OVi (Oficina Virtual de Hacienda)
2. Descargar certificado `.p12` de pruebas
3. En `/configuracion/empresa`: subir el `.p12` + PIN, ingresar usuario/clave TRIBU-CR
4. Emitir facturas de prueba y verificar aceptación en el sandbox
5. Cambiar `HACIENDA_AMBIENTE=PRODUCCION` y certificado real cuando esté listo

Los XML se construyen siguiendo el XSD v4.4 oficial. Campos clave: CABYS por línea, código de actividad económica del receptor, medios de pago en el resumen del XML.

## Arquitectura

```
app/                    # UI (Next.js App Router)
  (auth)/               # Login
  (dashboard)/          # Todas las rutas protegidas
    control/            # Dashboard
    ventas/             # Comprobantes + nueva factura
    clientes/           # CRUD clientes
    productos/          # CRUD productos
    inventario/         # Movimientos de stock
    rutas/              # Gestión de rutas
    reportes/           # 10 reportes
    configuracion/      # Empresa, usuarios, Hacienda

components/             # Componentes React reutilizables
domain/                 # Lógica de negocio pura (sin framework)
  facturacion/          # Cálculo de IVA, clave numérica, consecutivo
  hacienda/             # Construcción XML v4.4, firma XAdES-BES
infrastructure/         # DB (Drizzle), Hacienda (TRIBU-CR), email
lib/                    # Sesión, dinero (decimal.js), fechas
tests/
  unit/                 # Tests Vitest (dominio fiscal)
  e2e/                  # Tests Playwright
```

**Regla de dinero:** nunca se usan floats. Todos los montos son `decimal.js` o `numeric(19,5)` en PostgreSQL. Redondeo de Hacienda: 5 decimales internos, 2 en presentación.

## Despliegue en producción

1. Asegurarse de que `HACIENDA_AMBIENTE=PRODUCCION` y credenciales reales configuradas
2. Generar secretos seguros: `openssl rand -hex 32`
3. Correr migraciones: `pnpm db:migrate`
4. Build y start: `docker compose up --build -d`
5. Configurar un proxy (nginx/Caddy) para SSL en el dominio

## Licencia

Uso interno — propietario de Ganadera Prado S.A.
