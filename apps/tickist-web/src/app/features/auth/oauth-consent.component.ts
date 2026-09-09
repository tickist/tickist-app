import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SUPABASE_CLIENT } from '../../config/supabase.provider';

interface OAuthAuthorizationDetails {
  authorization_id: string;
  redirect_url?: string;
  client: { id: string; name: string; uri: string; logo_uri: string };
  user: { id: string; email: string };
  scope: string;
}

@Component({
  selector: 'app-oauth-consent',
  templateUrl: './oauth-consent.component.html',
  styleUrl: './oauth-consent.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OAuthConsentComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly supabase = inject(SUPABASE_CLIENT);
  private readonly document = inject(DOCUMENT);

  readonly details = signal<OAuthAuthorizationDetails | null>(null);
  readonly loading = signal(true);
  readonly deciding = signal(false);
  readonly error = signal<string | null>(null);
  private readonly authorizationId =
    this.route.snapshot.queryParamMap.get('authorization_id') ??
    this.route.snapshot.queryParamMap.get('authorizationId');

  constructor() {
    afterNextRender(() => void this.load());
  }

  async decide(action: 'approve' | 'deny'): Promise<void> {
    if (!this.supabase || !this.authorizationId || this.deciding()) return;
    this.deciding.set(true);
    this.error.set(null);
    const response =
      action === 'approve'
        ? await this.supabase.auth.oauth.approveAuthorization(
            this.authorizationId,
            { skipBrowserRedirect: true }
          )
        : await this.supabase.auth.oauth.denyAuthorization(
            this.authorizationId,
            { skipBrowserRedirect: true }
          );
    if (response.error || !response.data?.redirect_url) {
      this.error.set(response.error?.message ?? 'OAuth redirect is missing.');
      this.deciding.set(false);
      return;
    }
    this.document.location.assign(response.data.redirect_url);
  }

  private async load(): Promise<void> {
    if (!this.supabase) {
      this.error.set('Supabase is not configured.');
      this.loading.set(false);
      return;
    }
    if (!this.authorizationId) {
      this.error.set('Missing authorization_id.');
      this.loading.set(false);
      return;
    }
    const { data, error } =
      await this.supabase.auth.oauth.getAuthorizationDetails(
        this.authorizationId
      );
    if (error || !data) {
      this.error.set(error?.message ?? 'Authorization request was not found.');
      this.loading.set(false);
      return;
    }
    if (data.redirect_url) {
      this.document.location.assign(data.redirect_url);
      return;
    }
    this.details.set(data);
    this.loading.set(false);
  }
}
