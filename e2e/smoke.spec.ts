import { expect, test } from "@playwright/test"

test("inicio muestra el hero principal", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/color/i)
})

test("login expone campos de acceso", async ({ page }) => {
  await page.goto("/login")
  await expect(page.getByRole("button", { name: /ingresar al sistema/i })).toBeVisible()
  await expect(page.locator('input[name="email"]')).toBeVisible()
  await expect(page.locator('input[name="password"]')).toBeVisible()
})
