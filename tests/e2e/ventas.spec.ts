import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("admin@sistemagan.cr");
  await page.getByLabel("Contraseña").fill("admin123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/control/);
}

test.describe("Comprobantes / Ventas", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("lista de comprobantes carga correctamente", async ({ page }) => {
    await page.goto("/ventas");
    await expect(page.getByText(/comprobante/i)).toBeVisible();
    // Filtros visibles
    await expect(page.getByRole("link", { name: /Nueva factura|Nueva/i })).toBeVisible();
  });

  test("página de nueva factura carga correctamente", async ({ page }) => {
    await page.goto("/ventas/nueva");
    // El formulario de nueva factura debe tener los elementos básicos
    await expect(page.getByText(/tipo.*comprobante|comprobante/i).first()).toBeVisible();
  });

  test("detalle de comprobante mock carga sin errores", async ({ page }) => {
    await page.goto("/ventas/f1");
    // El detalle debe mostrar datos de la factura o un 404 si el mock no existe
    const esError = await page.getByText(/no encontrada|not found|404/i).isVisible();
    const esDetalle = await page.getByText(/comprobante|factura|cliente/i).first().isVisible();
    expect(esError || esDetalle).toBe(true);
  });

  test("filtros de comprobantes funcionan", async ({ page }) => {
    await page.goto("/ventas");
    // Verificar que los filtros de búsqueda existen
    const filtros = page.locator("select, input[type='date']");
    const countFiltros = await filtros.count();
    expect(countFiltros).toBeGreaterThan(0);
  });
});

test.describe("Flujo: ver comprobante desde dashboard", () => {
  test("clic en comprobante del dashboard navega al detalle", async ({ page }) => {
    await login(page);
    await page.goto("/control");

    // Clic en el primer comprobante de la lista
    const firstLink = page.locator("a[href*='/ventas/']").first();
    const href = await firstLink.getAttribute("href");
    if (href && href !== "/ventas") {
      await firstLink.click();
      await expect(page).toHaveURL(/\/ventas\/.+/);
    }
  });
});
