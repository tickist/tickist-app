import { ensureE2EAuthUser, resetDatabase } from './e2e-db';

export default async function globalSetup(): Promise<void> {
  await resetDatabase('setup');
  await ensureE2EAuthUser();
}
