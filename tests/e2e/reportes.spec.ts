import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("admin@sistemagan.cr");
  await page.getByLabel("Contraseña").fill("admin123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/control/);
}

const REPORTES = [
  "ventas-mensual",
  "ventas-detallado",
  "impuestos-ventas",
  "clientes",
  "creditos",
];

test.describe("Reportes", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("índice de reportes muestra las 10 tarjetas", async ({ page }) => {
    await page.goto("/reportes");
    await expect(page.getByText("Reportes")).toBeVisible();
    // All 5 categories visible
    for (const cat of ["Ventas", "Compras", "Clientes", "Inventario", "Impuestos"]) {
      await expect(page.getByText(cat).first()).toBeVisible();
    }
  });

  for (const tipo of REPORTES) {
    test(`reporte ${tipo} carga con datos mock`, async ({ page }) => {
      await page.goto(`/reportes/${tipo}`);
      // Should show a table or "sin datos" — not a 500 error
      const hasTable = await page.locator("table").isVisible();
      const hasEmpty = await page.getByText(/sin datos|no hay|no se encontraron/i).isVisible();
      const hasError = await page.getByText(/error|500/i).isVisible();
      expect(hasError).toBe(false);
      expect(hasTable || hasEmpty).toBe(true);
    });
  }

  test("botón de imprimir está visible en un reporte", async ({ page }) => {
    await page.goto("/reportes/ventas-mensual");
    await expect(page.getByRole("button", { name: /imprimir/i })).toBeVisible();
  });

  test("botón de exportar Excel está visible en un reporte", async ({ page }) => {
    await page.goto("/reportes/ventas-mensual");
    await expect(page.getByRole("button", { name: /excel|exportar/i })).toBeVisible();
  });

  test("URL tipo inválido devuelve 404", async ({ page }) => {
    const response = await page.goto("/reportes/no-existe");
    // Next.js notFound() returns a 404
    expect(response?.status()).toBe(404);
  });
});
