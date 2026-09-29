// Test-only documents; never publish this release outside a freshly reset local E2E stack.
export const E2E_LEGAL_VERSION = 'e2e-fixture-v1';

export const E2E_LEGAL_RELEASE = {
  version: E2E_LEGAL_VERSION,
  locale: 'en',
  terms_text:
    '# Test terms\n\nE2E fixture only. Not a published Tickist policy.',
  privacy_text:
    '# Test privacy\n\nE2E fixture only. Not a published Tickist policy.',
  published_at: '2020-01-01T00:00:00Z',
  is_current: true,
};

// The reset setup supplies these server-side values; this module is never imported by the app.
export async function seedLocalLegalFixture(
  apiUrl: string | null,
  secret: string | null
): Promise<void> {
  if (
    !apiUrl ||
    !secret ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(apiUrl).hostname)
  ) {
    throw new Error(
      'Legal E2E fixtures require a local API and a server-side test key.'
    );
  }

  const endpoint = `${apiUrl.replace(/\/+$/, '')}/rest/v1/legal_releases`;

  const headers = {
    apikey: secret,
    Authorization: `Bearer ${secret}`,
    'Content-Type': 'application/json',
  };

  const existing = await fetch(`${endpoint}?select=version`, { headers });

  const rows: Array<{ version: string }> = existing.ok
    ? await existing.json()
    : [];

  // Migration 0027 publishes this real release during the isolated local reset.
  // Preserve it unchanged, while selecting the test-only release for E2E signup.

  if (
    !existing.ok ||
    rows.some((row) => row.version !== '2026-09-30.1') ||
    rows.length > 1
  ) {
    throw new Error(
      'Refusing to seed legal fixtures into a nonempty release catalog.'
    );
  }

  if (rows.length === 1) {
    const deselect = await fetch(`${endpoint}?version=eq.2026-09-30.1`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ is_current: false }),
    });

    if (!deselect.ok)
      throw new Error('Could not select the local test-only legal release.');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(E2E_LEGAL_RELEASE),
  });

  if (!response.ok)
    throw new Error(
      `Could not seed local legal E2E fixture (${response.status}).`
    );
}
