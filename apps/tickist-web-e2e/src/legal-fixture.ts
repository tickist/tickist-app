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

  // Migrations 0027 and 0028 publish these releases during the isolated reset.
  // Preserve their text while selecting the test-only release for E2E signup.
  const deploymentVersions = new Set(['2026-09-30.1', '2026-09-30.2']);

  if (
    !existing.ok ||
    rows.some((row) => !deploymentVersions.has(row.version)) ||
    new Set(rows.map((row) => row.version)).size !== rows.length
  ) {
    throw new Error(
      'Refusing to seed legal fixtures into a nonempty release catalog.'
    );
  }

  for (const { version } of rows) {
    const deselect = await fetch(`${endpoint}?version=eq.${version}`, {
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
