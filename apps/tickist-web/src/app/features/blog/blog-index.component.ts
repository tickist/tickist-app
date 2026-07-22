import { DOCUMENT, DatePipe } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  BLOG_LOCALES,
  BlogLocale,
  getBlogContent,
  isBlogLocale,
} from './blog-content';

const SITE_ORIGIN = 'https://tickist.com';

@Component({
  standalone: true,
  selector: 'app-blog-index',
  imports: [RouterLink, DatePipe],
  templateUrl: './blog-index.component.html',
  styleUrl: './blog-index.component.css',
})
export class BlogIndexComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly routeLocale = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('locale'))),
    { initialValue: 'en' }
  );

  readonly locale = computed<BlogLocale>(() => {
    const locale = this.routeLocale();
    return isBlogLocale(locale) ? locale : 'en';
  });
  readonly content = computed(() => getBlogContent(this.locale()));
  readonly getBlogContent = getBlogContent;
  readonly otherLocales = computed(() =>
    BLOG_LOCALES.filter((locale) => locale !== this.locale())
  );

  constructor() {
    effect(() => this.applyMetadata(this.content()));
  }

  trackPost(_: number, post: { slug: string }): string {
    return post.slug;
  }

  private applyMetadata(content: ReturnType<typeof getBlogContent>): void {
    const canonicalUrl = `${SITE_ORIGIN}${content.pathPrefix}`;
    const title = `${content.title} | Tickist`;

    this.document.documentElement.lang = content.locale;
    this.document.title = title;
    this.upsertMeta('name', 'description', content.description);
    this.upsertMeta('name', 'robots', 'index,follow,max-image-preview:large');
    this.upsertMeta('property', 'og:type', 'website');
    this.upsertMeta('property', 'og:site_name', 'Tickist');
    this.upsertMeta('property', 'og:title', title);
    this.upsertMeta('property', 'og:description', content.description);
    this.upsertMeta('property', 'og:url', canonicalUrl);
    this.upsertMeta('property', 'og:locale', content.locale);
    this.upsertMeta('name', 'twitter:card', 'summary');
    this.upsertMeta('name', 'twitter:title', title);
    this.upsertMeta('name', 'twitter:description', content.description);
    this.upsertCanonical(canonicalUrl);
    this.upsertStructuredData(content, canonicalUrl);
  }

  private upsertMeta(
    attribute: 'name' | 'property',
    value: string,
    content: string
  ): void {
    const selector = `meta[${attribute}="${value}"]`;
    const element =
      this.document.head.querySelector<HTMLMetaElement>(selector) ??
      this.document.createElement('meta');

    element.setAttribute(attribute, value);
    element.content = content;

    if (!element.parentNode) {
      this.document.head.append(element);
    }
  }

  private upsertCanonical(url: string): void {
    const element =
      this.document.head.querySelector<HTMLLinkElement>(
        'link[rel="canonical"]'
      ) ?? this.document.createElement('link');

    element.rel = 'canonical';
    element.href = url;

    if (!element.parentNode) {
      this.document.head.append(element);
    }
  }

  private upsertStructuredData(
    content: ReturnType<typeof getBlogContent>,
    canonicalUrl: string
  ): void {
    const id = 'tickist-blog-structured-data';
    const element =
      this.document.getElementById(id) ?? this.document.createElement('script');

    element.id = id;
    element.type = 'application/ld+json';
    element.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: content.title,
      description: content.description,
      url: canonicalUrl,
      inLanguage: content.locale,
      isPartOf: {
        '@type': 'WebSite',
        name: 'Tickist',
        url: SITE_ORIGIN,
      },
    });

    if (!element.parentNode) {
      this.document.head.append(element);
    }
  }
}
