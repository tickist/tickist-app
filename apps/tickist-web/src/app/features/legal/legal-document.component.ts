import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { marked } from 'marked';
import { LegalDocumentService, LegalRelease } from './legal-document.service';

@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
      .tickist-legal-copy {
        line-height: 1.7;
        overflow-wrap: anywhere;
      }
      .tickist-legal-copy h1,
      .tickist-legal-copy h2,
      .tickist-legal-copy h3 {
        margin: 1.5em 0 0.5em;
        font-weight: 600;
        font-size: 1.25em;
      }
      .tickist-legal-copy p,
      .tickist-legal-copy ul,
      .tickist-legal-copy ol {
        margin: 1em 0;
      }
      .tickist-legal-copy ul,
      .tickist-legal-copy ol {
        padding-left: 1.5em;
        list-style: revert;
      }
      .tickist-legal-copy a {
        text-decoration: underline;
      }
      .tickist-legal-copy table {
        display: block;
        overflow-x: auto;
        border-collapse: collapse;
      }
      .tickist-legal-copy td,
      .tickist-legal-copy th {
        padding: 0.5em;
        border: 1px solid currentColor;
      }
    `,
  ],
  selector: 'app-legal-document',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <a routerLink="/" class="underline underline-offset-2">Tickist</a>
      <h1 class="text-3xl font-semibold">{{ title() }}</h1>
      @if (loading()) {
      <p role="status">Loading…</p>
      } @if (message()) {
      <p role="status">{{ message() }}</p>
      } @if (release(); as document) {
      <p>Version {{ document.version }} · {{ document.published_at }}</p>
      <button type="button" class="btn" (click)="download()">
        Download this version
      </button>
      <article
        class="tickist-legal-copy"
        [attr.lang]="document.locale"
        [innerHTML]="html()"
      ></article>
      }
    </main>
  `,
})
export class LegalDocumentComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly documents = inject(LegalDocumentService);
  readonly kind = signal<string | null>(null);
  readonly title = computed(() =>
    this.kind() === 'terms' ? 'Terms of Service' : 'Privacy Policy'
  );
  private generation = 0;
  readonly loading = signal(true);
  readonly release = signal<LegalRelease | null>(null);
  readonly message = signal('');
  readonly html = signal('');

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.kind.set(params.get('document'));
      void this.load(params.get('version') ?? undefined);
    });
  }

  private async load(version?: string): Promise<void> {
    const generation = ++this.generation;
    this.loading.set(true);
    this.message.set('');
    this.release.set(null);

    try {
      if (this.kind() !== 'terms' && this.kind() !== 'privacy') {
        this.message.set('Document not found.');

        return;
      }

      const release = await this.documents.load(version);

      if (generation !== this.generation) return;

      if (!release) {
        this.message.set('This document is not available yet.');

        return;
      }

      this.release.set(release);
      // Angular sanitizes this HTML binding. Never bypass its sanitizer.
      this.html.set(marked.parse(this.text(release), { async: false }));
    } catch {
      if (generation === this.generation)
        this.message.set('Could not load this document. Please try again.');
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }

  private text(release: LegalRelease): string {
    return this.kind() === 'terms' ? release.terms_text : release.privacy_text;
  }

  download(): void {
    const release = this.release();

    if (!release) return;

    const url = URL.createObjectURL(
      new Blob(
        [
          `${this.title()}\nVersion: ${release.version}\nPublished: ${
            release.published_at
          }\n\n${this.text(release)}`,
        ],
        { type: 'text/plain;charset=utf-8' }
      )
    );

    const link = document.createElement('a');
    link.href = url;
    link.download = `tickist-${this.kind()}-${release.version}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
