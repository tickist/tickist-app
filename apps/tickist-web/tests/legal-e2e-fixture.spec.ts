import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  E2E_LEGAL_RELEASE,
  seedLocalLegalFixture,
} from '../../tickist-web-e2e/src/legal-fixture';

afterEach(() => vi.unstubAllGlobals());

describe('Legal E2E fixture guard', () => {
  it('refuses remote API hosts without making a request', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await expect(
      seedLocalLegalFixture('https://remote.example.invalid', 'test-key')
    ).rejects.toThrow('local API');
    await expect(
      seedLocalLegalFixture('http://127.0.0.1:54321', null)
    ).rejects.toThrow('server-side test key');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses to insert fixtures when any release already exists', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify([{ version: 'existing' }]), { status: 200 })
      );

    vi.stubGlobal('fetch', fetch);
    await expect(
      seedLocalLegalFixture('http://127.0.0.1:54321', 'test-key')
    ).rejects.toThrow('nonempty release catalog');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('inserts clearly labeled test documents into an empty local catalog', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('[]', { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 201 }));

    vi.stubGlobal('fetch', fetch);
    await seedLocalLegalFixture('http://127.0.0.1:54321', 'test-key');
    expect(fetch).toHaveBeenLastCalledWith(
      'http://127.0.0.1:54321/rest/v1/legal_releases',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(E2E_LEGAL_RELEASE),
      })
    );
  });
});
