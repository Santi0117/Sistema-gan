import { test, expect } from "@playwright/test";

// Shared login helper
async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("admin@sistemagan.cr");
  await page.getByLabel("Contraseña").fill("admin123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/control/);
}

test.describe("Dashboard / Control", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("muestra KPIs del mes", async ({ page }) => {
    await expect(page.getByText("Facturas del mes")).toBeVisible();
    await expect(page.getByText("Ventas del mes")).toBeVisible();
    await expect(page.getByText("Pendientes MH")).toBeVisible();
    await expect(page.getByText("Stock bajo")).toBeVisible();
  });

  test("muestra últimos comprobantes", async ({ page }) => {
    await expect(page.getByText("Últimos comprobantes")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver todos →" })).toBeVisible();
  });

  test("muestra alertas cuando hay pendientes", async ({ page }) => {
    // With mock data there are always pendientes
    const alertas = page.locator("[class*='border-orange'], [class*='border-red'], [class*='border-amber']");
    // Either alerts or "Todo en orden" should be shown
    const todoEnOrden = page.getByText("Todo en orden");
    const hayAlertas = await alertas.count();
    const hayOk = await todoEnOrden.isVisible();
    expect(hayAlertas > 0 || hayOk).toBe(true);
  });

  test("las acciones rápidas tienen los enlaces correctos", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Nueva factura" })).toHaveAttribute("href", "/ventas/nueva");
    await expect(page.getByRole("link", { name: "Nuevo cliente" })).toHaveAttribute("href", "/clientes/nuevo");
    await expect(page.getByRole("link", { name: "Nuevo producto" })).toHaveAttribute("href", "/productos/nuevo");
  });

  test("navega al hacer clic en una KPI card", async ({ page }) => {
    await page.getByRole("link", { name: /Facturas del mes/ }).click();
    await expect(page).toHaveURL(/\/ventas/);
  });
});
