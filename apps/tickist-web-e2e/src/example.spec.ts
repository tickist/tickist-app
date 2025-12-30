import { test, expect } from '@playwright/test';

test('signup flow leads to app dashboard', async ({ page }, testInfo) => {
  const email = `e2e+${testInfo.project.name}-${Date.now()}@tickist.dev`;
  const password = 'Test1234!';

  await page.goto('/');

  await page.getByRole('link', { name: 'Create account' }).first().click();
  await page.waitForURL('**/auth/signup');

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();

  await page.waitForURL('**/auth', { timeout: 10000 });
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.waitForURL('**/app', { timeout: 10000 });
  await expect(page.getByPlaceholder(/Search tasks/)).toBeVisible();
});
