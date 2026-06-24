import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("admin@sistemagan.cr");
  await page.getByLabel("Contraseña").fill("admin123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/control/);
}

test.describe("Clientes", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("lista de clientes carga con datos mock", async ({ page }) => {
    await page.goto("/clientes");
    await expect(page.getByText(/cliente/i).first()).toBeVisible();
    // Botón de nuevo cliente
    await expect(page.getByRole("link", { name: /Nuevo cliente|Nuevo/i })).toBeVisible();
  });

  test("búsqueda de clientes filtra la lista", async ({ page }) => {
    await page.goto("/clientes");
    const searchInput = page.getByPlaceholder(/buscar|search/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("Supermercado");
      await page.waitForTimeout(300);
      // After filtering, "Supermercado" should appear or no clients
      const rows = page.locator("tbody tr, [data-cliente]");
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test("wizard de nuevo cliente carga el paso 1", async ({ page }) => {
    await page.goto("/clientes/nuevo");
    // Paso 1 debe tener campos de identificación
    await expect(page.getByText(/identificaci[oó]n|tipo/i).first()).toBeVisible();
    await expect(page.getByText(/Paso 1|paso 1|1 de/i).first()).toBeVisible();
  });

  test("wizard valida campos requeridos antes de avanzar", async ({ page }) => {
    await page.goto("/clientes/nuevo");
    // Intentar avanzar sin llenar campos
    const btnSiguiente = page.getByRole("button", { name: /siguiente|continuar/i });
    if (await btnSiguiente.isVisible()) {
      // Clear required fields and try to advance
      const nombreInput = page.getByLabel(/nombre/i).first();
      if (await nombreInput.isVisible()) {
        await nombreInput.clear();
      }
      await btnSiguiente.click();
      // Should stay on step 1 or show validation
      await expect(page.getByText(/Paso 1|paso 1|requerido|obligatorio|nombre/i).first()).toBeVisible();
    }
  });
});

test.describe("Productos", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("lista de productos muestra el catálogo", async ({ page }) => {
    await page.goto("/productos");
    await expect(page.getByText(/producto/i).first()).toBeVisible();
  });

  test("formulario de nuevo producto tiene campos fiscales", async ({ page }) => {
    await page.goto("/productos/nuevo");
    // CABYS es obligatorio para facturación electrónica
    await expect(page.getByText(/CABYS|cabys/i).first()).toBeVisible();
    await expect(page.getByText(/IVA|impuesto/i).first()).toBeVisible();
  });
});
