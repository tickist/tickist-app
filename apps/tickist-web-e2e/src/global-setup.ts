import { resetDatabase } from './e2e-db';

export default async function globalSetup(): Promise<void> {
  await resetDatabase('setup');
}
