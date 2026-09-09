import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { describe, expect, test, vi } from 'vitest';
import { SUPABASE_CLIENT } from '../../config/supabase.provider';
import { OAuthConsentComponent } from './oauth-consent.component';

describe('OAuthConsentComponent', () => {
  test('denies the authorization request through Supabase OAuth', async () => {
    const denyAuthorization = vi.fn(async () => ({
      data: null,
      error: { message: 'Authorization denied.' },
    }));
    TestBed.configureTestingModule({
      imports: [OAuthConsentComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (name: string) =>
                  name === 'authorization_id' ? 'authorization-1' : null,
              },
            },
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            auth: {
              oauth: {
                denyAuthorization,
              },
            },
          },
        },
      ],
    }).overrideComponent(OAuthConsentComponent, { set: { template: '' } });
    const component = TestBed.createComponent(
      OAuthConsentComponent
    ).componentInstance;

    await component.decide('deny');

    expect(denyAuthorization).toHaveBeenCalledWith('authorization-1', {
      skipBrowserRedirect: true,
    });
    expect(component.error()).toBe('Authorization denied.');
  });
});
