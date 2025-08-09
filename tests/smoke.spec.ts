import { test, expect } from '@playwright/test';

test('home loads and logo visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('img[alt="logo"], img[alt*="Strive"], [data-testid="app-logo"]')).toBeVisible();
});

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.skip(!email || !password, 'Skipping auth flow: E2E_USER_EMAIL/PASSWORD not set');

test('auth + habit create/complete persists', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/password/i).fill(password!);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page.getByText(/dashboard|habits/i)).toBeVisible();

  // create habit
  await page.getByRole('button', { name: /add habit/i }).click();
  await page.getByLabel(/name|title/i).fill('Test Habit');
  await page.getByRole('button', { name: /save|create/i }).click();
  await expect(page.getByText('Test Habit')).toBeVisible();

  // mark complete
  await page.getByRole('button', { name: /complete|done/i }).first().click();

  // reload, assert persisted
  await page.reload();
  await expect(page.getByText('Test Habit')).toBeVisible();
  // optionally assert completed state
});


