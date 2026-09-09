import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SUPABASE_CLIENT } from '../../config/supabase.provider';

interface OAuthGrant {
  client: { id: string; name: string; uri: string; logo_uri: string };
  scopes: string[];
  granted_at: string;
}

@Component({
  selector: 'app-connected-apps',
  imports: [RouterLink],
  templateUrl: './connected-apps.component.html',
  styleUrl: './connected-apps.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectedAppsComponent {
  private readonly supabase = inject(SUPABASE_CLIENT);
  readonly grants = signal<OAuthGrant[]>([]);
  readonly loading = signal(true);
  readonly revoking = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  constructor() {
    afterNextRender(() => void this.load());
  }

  async revoke(clientId: string): Promise<void> {
    if (!this.supabase || this.revoking()) return;
    this.revoking.set(clientId);
    this.error.set(null);
    const { error } = await this.supabase.auth.oauth.revokeGrant({ clientId });
    if (error) this.error.set(error.message);
    else
      this.grants.update((items) =>
        items.filter((item) => item.client.id !== clientId)
      );
    this.revoking.set(null);
  }

  private async load(): Promise<void> {
    if (!this.supabase) {
      this.error.set('Supabase is not configured.');
      this.loading.set(false);
      return;
    }
    const { data, error } = await this.supabase.auth.oauth.listGrants();
    if (error) this.error.set(error.message);
    else this.grants.set(data ?? []);
    this.loading.set(false);
  }
}
