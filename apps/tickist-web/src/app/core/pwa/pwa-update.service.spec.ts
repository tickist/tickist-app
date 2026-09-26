import { TestBed } from '@angular/core/testing';
import type { registerSW } from 'virtual:pwa-register';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastService } from '../ui/toast.service';
import {
  PwaUpdateService,
  REGISTER_SERVICE_WORKER,
} from './pwa-update.service';

const registerServiceWorker = vi.fn<typeof registerSW>();

describe('PwaUpdateService', () => {
  let service: PwaUpdateService;
  let infoWithAction: ReturnType<typeof vi.fn<ToastService['infoWithAction']>>;

  let updateServiceWorker: ReturnType<
    typeof vi.fn<ReturnType<typeof registerSW>>
  >;

  beforeEach(() => {
    infoWithAction = vi.fn<ToastService['infoWithAction']>();
    updateServiceWorker = vi.fn(async () => undefined);
    registerServiceWorker.mockReset();
    registerServiceWorker.mockReturnValue(updateServiceWorker);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {},
    });

    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        { provide: REGISTER_SERVICE_WORKER, useValue: registerServiceWorker },
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

    const options = registerServiceWorker.mock.calls[0]?.[0];

    options?.onNeedRefresh?.();

    expect(infoWithAction).toHaveBeenCalledWith(
      'A new version is available. Refresh to update.',
      'Refresh',
      expect.any(Function)
    );

    const refresh = infoWithAction.mock.calls[0]?.[2];

    await refresh?.();
    expect(updateServiceWorker).toHaveBeenCalledTimes(1);
  });
});
