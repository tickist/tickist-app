import { expect, type Page, test } from '@playwright/test';

test('changes password from settings and restores the original password', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'This flow mutates the shared E2E auth user password and runs only in chromium.'
  );

  const email = process.env['E2E_AUTH_EMAIL'] ?? 'e2e-shared-user@tickist.dev';
  const originalPassword = process.env['E2E_AUTH_PASSWORD'] ?? 'Test1234!';
  const nextPassword = `Tickist-${Date.now()}-Aa1!`;
  let activePassword = originalPassword;

  try {
    await signIn(page, email, originalPassword);
    await expect(page).toHaveURL(/\/app(?:\/|$)/, { timeout: 15000 });

    await expectInvalidCurrentPassword(page, nextPassword);

    await changePassword(page, originalPassword, nextPassword);
    activePassword = nextPassword;

    await expectSignedOutAfterPasswordChange(page);

    await signIn(page, email, nextPassword);
    await expect(page).toHaveURL(/\/app(?:\/|$)/, { timeout: 15000 });

    await changePassword(page, nextPassword, originalPassword);
    activePassword = originalPassword;

    await expectSignedOutAfterPasswordChange(page);

    await signIn(page, email, originalPassword);
    await expect(page).toHaveURL(/\/app(?:\/|$)/, { timeout: 15000 });
  } finally {
    if (activePassword !== originalPassword) {
      await ensureAuthenticated(page, email, activePassword);
      await changePassword(page, activePassword, originalPassword);
      await expectSignedOutAfterPasswordChange(page);
      await signIn(page, email, originalPassword);
    }
  }
});

async function ensureAuthenticated(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/auth');

  const pathname = new URL(page.url()).pathname;
  if (pathname.startsWith('/app')) {
    await expect(page.getByPlaceholder(/Search tasks/)).toBeVisible();
    return;
  }

  await signIn(page, email, password);
}

async function signIn(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/auth');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/app(?:\/|$)/, { timeout: 15000 });
  await expect(page.getByPlaceholder(/Search tasks/)).toBeVisible();
}

async function expectInvalidCurrentPassword(
  page: Page,
  nextPassword: string
): Promise<void> {
  await page.goto('/app/settings');
  await expectSettingsSheetLayout(page);
  await page.getByRole('button', { name: 'Password' }).click();
  await page.getByTestId('settings-current-password').fill('WrongPassword123!');
  await page.getByTestId('settings-new-password').fill(nextPassword);
  await page.getByTestId('settings-confirm-password').fill(nextPassword);
  await page.getByTestId('settings-password-submit').click();

  await expect(page.getByTestId('settings-password-error')).toContainText(
    'Current password is incorrect.'
  );
  await expect(page).toHaveURL(/\/app\/settings(?:\/|$)/);
}

async function changePassword(
  page: Page,
  currentPassword: string,
  nextPassword: string
): Promise<void> {
  await page.goto('/app/settings');
  await expectSettingsSheetLayout(page);
  await page.getByRole('button', { name: 'Password' }).click();
  await page.getByTestId('settings-current-password').fill(currentPassword);
  await page.getByTestId('settings-new-password').fill(nextPassword);
  await page.getByTestId('settings-confirm-password').fill(nextPassword);
  await page.getByTestId('settings-password-submit').click();
}

async function expectSignedOutAfterPasswordChange(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/auth(?:\?.*)?$/, { timeout: 15000 });
  await expect(
    page.getByText('Password changed. Sign in with your new password.')
  ).toBeVisible();
}

async function expectSettingsSheetLayout(page: Page): Promise<void> {
  const settings = page.locator('app-settings');
  const sheet = settings.locator('.sheet-shell');

  await expect(sheet).toBeVisible();
  await expect(settings.locator('.sheet-shell__panel-scroll')).toBeVisible();
  await expect(settings.locator('.sheet-shell__footer')).toHaveCount(1);
}
