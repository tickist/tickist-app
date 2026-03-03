import { resetDatabase } from './e2e-db';

export default async function globalTeardown(): Promise<void> {
  if (process.env['E2E_SKIP_DB_RESET_TEARDOWN'] === 'true') {
    return;
  }

  try {
    await resetDatabase('teardown');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[e2e-db] teardown reset failed and will be ignored: ${message}`
    );
  }
}
