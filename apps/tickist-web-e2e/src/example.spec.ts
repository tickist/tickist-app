/* eslint-disable playwright/no-conditional-in-test */
import { expect, type Page, test } from '@playwright/test';
import { E2E_LEGAL_VERSION } from './legal-fixture';

async function waitForAuthOrApp(page: Page): Promise<'auth' | 'app'> {
  await expect
    .poll(
      () => {
        const { pathname } = new URL(page.url());

        return pathname;
      },
      { timeout: 15000 }
    )
    .toMatch(/^\/(?:app(?:\/|$)|auth\/?$)/);

  const { pathname } = new URL(page.url());

  return pathname.startsWith('/app') ? 'app' : 'auth';
}

test('signup flow leads to app dashboard', async ({ page }, testInfo) => {
  const email = `e2e+${testInfo.project.name}-${Date.now()}@tickist.dev`;
  const password = 'Test1234!';

  await page.goto('/');
  const root = page.locator('html');
  const initialTheme = (await root.getAttribute('data-theme')) ?? 'tickist';
  const toggledTheme = initialTheme === 'tickist' ? 'tickist-light' : 'tickist';

  await page.getByTestId('theme-toggle').first().click();
  await expect(root).toHaveAttribute('data-theme', toggledTheme);

  await page.reload();
  await expect(root).toHaveAttribute('data-theme', toggledTheme);

  await page.getByRole('link', { name: 'Get started' }).click();
  await page.waitForURL('**/auth/signup');
  await expect(root).toHaveAttribute('data-theme', toggledTheme);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password', { exact: true }).fill(password);
  const createAccount = page.getByRole('button', { name: 'Create account' });
  await expect(createAccount).toBeDisabled();
  await expect(
    page.getByRole('link', { name: 'Terms of Service' })
  ).toHaveAttribute('href', `/legal/terms/${E2E_LEGAL_VERSION}`);
  await page.getByRole('checkbox', { name: /I accept the/ }).check();
  await expect(createAccount).toBeEnabled();
  await createAccount.click();

  const postSignupLocation = await waitForAuthOrApp(page);

  if (postSignupLocation === 'auth') {
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
  }

  await expect(page).toHaveURL(/\/app(?:\/|$)/, { timeout: 10000 });
  await expect(root).toHaveAttribute('data-theme', toggledTheme);
  await expect(page.getByTestId('theme-toggle').first()).toBeVisible();
  await expect(page.getByPlaceholder(/Search tasks/)).toBeVisible();
});
