import { ensureE2EAuthUser, resetDatabase } from './e2e-db';

export default async function globalSetup(): Promise<void> {
  if (process.env['E2E_SKIP_DB_RESET_SETUP'] !== 'true') {
    await resetDatabase('setup');
  }
  await ensureE2EAuthUser();
}
