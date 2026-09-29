import { Injectable, inject } from '@angular/core';
import { SUPABASE_CLIENT } from '../../config/supabase.provider';

export interface LegalRelease {
  version: string;
  locale: 'en' | 'pl';
  terms_text: string;
  privacy_text: string;
  published_at: string;
}

@Injectable({ providedIn: 'root' })
export class LegalDocumentService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });

  async load(version?: string): Promise<LegalRelease | null> {
    if (!this.supabase) throw new Error('Legal documents could not be loaded.');

    let query = this.supabase
      .from('legal_releases')
      .select('version, locale, terms_text, privacy_text, published_at');

    query = version
      ? query.eq('version', version)
      : query.eq('is_current', true);

    const { data, error } = await query
      .lte('published_at', new Date().toISOString())
      .maybeSingle();

    if (error) throw new Error('Legal documents could not be loaded.');

    // SAFETY: The selected columns match LegalRelease; migration 0026 enforces locale, nonnull texts and version.
    return data as LegalRelease | null;
  }
}
