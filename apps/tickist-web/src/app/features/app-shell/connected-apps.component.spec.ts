import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, test, vi } from 'vitest';
import { SUPABASE_CLIENT } from '../../config/supabase.provider';
import { ConnectedAppsComponent } from './connected-apps.component';

describe('ConnectedAppsComponent', () => {
  test('revokes a grant and removes it from the visible list', async () => {
    const revokeGrant = vi.fn(async () => ({ error: null }));
    TestBed.configureTestingModule({
      imports: [ConnectedAppsComponent],
      providers: [
        provideRouter([]),
        {
          provide: SUPABASE_CLIENT,
          useValue: { auth: { oauth: { revokeGrant } } },
        },
      ],
    }).overrideComponent(ConnectedAppsComponent, { set: { template: '' } });
    const component = TestBed.createComponent(
      ConnectedAppsComponent
    ).componentInstance;
    component.grants.set([
      {
        client: {
          id: 'client-1',
          name: 'MCP client',
          uri: 'https://client.example',
          logo_uri: '',
        },
        scopes: ['tasks:read'],
        granted_at: '2026-09-05T00:00:00Z',
      },
    ]);

    await component.revoke('client-1');

    expect(revokeGrant).toHaveBeenCalledWith({ clientId: 'client-1' });
    expect(component.grants()).toEqual([]);
  });
});
