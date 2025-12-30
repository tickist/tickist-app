import { resetDatabase } from './e2e-db';

export default async function globalTeardown(): Promise<void> {
  await resetDatabase('teardown');
}
