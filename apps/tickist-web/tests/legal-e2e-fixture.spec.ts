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

  it('refuses to insert fixtures when an unexpected release exists', async () => {
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

  it.each([
    ['2026-09-30.1'],
    ['2026-09-30.2'],
    ['2026-09-30.1', '2026-09-30.2'],
  ])(
    'preserves deployment documents %j and selects a synthetic release',
    async (...versions) => {
      const fetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(versions.map((version) => ({ version }))))
        );

      for (let index = 0; index < versions.length; index++) {
        fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
      }

      fetch.mockResolvedValueOnce(new Response(null, { status: 201 }));
      vi.stubGlobal('fetch', fetch);

      await seedLocalLegalFixture('http://127.0.0.1:54321', 'test-key');

      for (const [index, version] of versions.entries()) {
        expect(fetch).toHaveBeenNthCalledWith(
          index + 2,
          `http://127.0.0.1:54321/rest/v1/legal_releases?version=eq.${version}`,
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ is_current: false }),
          })
        );
      }

      expect(fetch).toHaveBeenLastCalledWith(
        'http://127.0.0.1:54321/rest/v1/legal_releases',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(E2E_LEGAL_RELEASE),
        })
      );
    }
  );

  it('rejects duplicate deployment versions before any write', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify([
            { version: '2026-09-30.1' },
            { version: '2026-09-30.1' },
          ])
        )
      );

    vi.stubGlobal('fetch', fetch);

    await expect(
      seedLocalLegalFixture('http://127.0.0.1:54321', 'test-key')
    ).rejects.toThrow('nonempty release catalog');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('does not insert a fixture when deselecting the deployment release fails', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ version: '2026-09-30.1' }]))
      )
      .mockResolvedValueOnce(new Response(null, { status: 500 }));

    vi.stubGlobal('fetch', fetch);

    await expect(
      seedLocalLegalFixture('http://127.0.0.1:54321', 'test-key')
    ).rejects.toThrow('Could not select');
    expect(fetch).toHaveBeenCalledTimes(2);
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
