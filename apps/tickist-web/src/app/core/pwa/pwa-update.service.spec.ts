import { TestBed } from '@angular/core/testing';
import { type RegisterSWOptions } from 'vite-plugin-pwa/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastService } from '../ui/toast.service';
import { PwaUpdateService } from './pwa-update.service';

const pwaMocks = vi.hoisted(() => ({
  registerSW: vi.fn(),
}));

vi.mock('virtual:pwa-register', () => ({
  registerSW: pwaMocks.registerSW,
}));

describe('PwaUpdateService', () => {
  let service: PwaUpdateService;
  let infoWithAction: ReturnType<typeof vi.fn>;
  let updateServiceWorker: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    infoWithAction = vi.fn();
    updateServiceWorker = vi.fn(async () => undefined);
    pwaMocks.registerSW.mockReset();
    pwaMocks.registerSW.mockReturnValue(updateServiceWorker);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {},
    });

    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        {
          provide: ToastService,
          useValue: { infoWithAction },
        },
      ],
    });
    service = TestBed.inject(PwaUpdateService);
  });

  it('shows a refresh action when a new version is available', async () => {
    service.start();
    const options = pwaMocks.registerSW.mock.calls[0]?.[0] as
      | RegisterSWOptions
      | undefined;

    options?.onNeedRefresh?.();

    expect(infoWithAction).toHaveBeenCalledWith(
      'A new version is available. Refresh to update.',
      'Refresh',
      expect.any(Function)
    );

    const refresh = infoWithAction.mock.calls[0]?.[2] as
      | (() => Promise<void>)
      | undefined;
    await refresh?.();
    expect(updateServiceWorker).toHaveBeenCalledTimes(1);
  });
});
