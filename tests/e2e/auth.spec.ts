import { test, expect } from "@playwright/test";

test.describe("Autenticación", () => {
  test("muestra la pantalla de login cuando no está autenticado", async ({ page }) => {
    await page.goto("/control");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("SistemaGan")).toBeVisible();
    await expect(page.getByLabel("Correo electrónico")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
  });

  test("login exitoso redirige al dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Correo electrónico").fill("admin@sistemagan.cr");
    await page.getByLabel("Contraseña").fill("admin123");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page).toHaveURL(/\/control/);
    await expect(page.getByText(/Buen día|Buenas tardes|Buenas noches/)).toBeVisible();
  });

  test("muestra error con credenciales incorrectas", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Correo electrónico").fill("mal@usuario.cr");
    await page.getByLabel("Contraseña").fill("wrongpassword");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page.getByText(/credenciales|usuario|contraseña/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
