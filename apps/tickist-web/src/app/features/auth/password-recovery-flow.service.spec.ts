import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Subject } from 'rxjs';
import { PasswordRecoveryFlowService } from './password-recovery-flow.service';
import { SupabaseSessionService } from './supabase-session.service';

describe('PasswordRecoveryFlowService', () => {
  let navigationEvents: Subject<NavigationEnd>;
  let navigateByUrlMock: ReturnType<typeof vi.fn>;
  let recoveryPending: ReturnType<typeof signal<boolean>>;
  let router: RecoveryRouter;

  beforeEach(() => {
    navigationEvents = new Subject<NavigationEnd>();
    navigateByUrlMock = vi.fn(async () => true);
    recoveryPending = signal(false);
    router = {
      url: '/',
      events: navigationEvents,
      navigateByUrl: navigateByUrlMock,
    };

    TestBed.configureTestingModule({
      providers: [
        PasswordRecoveryFlowService,
        {
          provide: Router,
          useValue: router,
        },
        {
          provide: SupabaseSessionService,
          useValue: {
            passwordRecoveryPending: () => recoveryPending(),
          },
        },
      ],
    });

    TestBed.inject(PasswordRecoveryFlowService);
  });

  it('redirects recovery callbacks that land on the root URL', async () => {
    recoveryPending.set(true);
    navigationEvents.next(new NavigationEnd(1, '/', '/'));
    await Promise.resolve();

    expect(navigateByUrlMock).toHaveBeenCalledWith('/auth/update-password', {
      replaceUrl: true,
    });
  });

  it('redirects later navigations away from app routes while recovery is pending', async () => {
    recoveryPending.set(true);
    await Promise.resolve();
    navigateByUrlMock.mockClear();

    router.url = '/app';
    navigationEvents.next(new NavigationEnd(1, '/app', '/app'));
    await Promise.resolve();

    expect(navigateByUrlMock).toHaveBeenCalledWith('/auth/update-password', {
      replaceUrl: true,
    });
  });

  it('does not redirect when the user is already on the update-password screen', async () => {
    router.url = '/auth/update-password';

    recoveryPending.set(true);
    await Promise.resolve();

    expect(navigateByUrlMock).not.toHaveBeenCalled();
  });
});

interface RecoveryRouter {
  url: string;
  events: Subject<NavigationEnd>;
  navigateByUrl: ReturnType<typeof vi.fn>;
}
