import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { BlogLocale } from './blog-content';

const SITE_ORIGIN = 'https://tickist.com';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/icons/icon-512x512.png`;

export interface BlogSeoConfig {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly locale: BlogLocale;
  readonly type?: 'website' | 'article';
  readonly image?: string;
  readonly imageAlt?: string;
  readonly robots?: string;
  readonly publishedAt?: string;
  readonly updatedAt?: string | null;
  readonly category?: string;
  readonly tags?: readonly string[];
  readonly alternates?: readonly { locale: BlogLocale; path: string }[];
  readonly jsonLd?: readonly Record<string, unknown>[];
}

@Injectable({ providedIn: 'root' })
export class BlogSeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  apply(config: BlogSeoConfig): void {
    const canonical = `${SITE_ORIGIN}${config.path}`;
    const image = config.image?.startsWith('http')
      ? config.image
      : `${SITE_ORIGIN}${
          config.image ?? DEFAULT_IMAGE.replace(SITE_ORIGIN, '')
        }`;
    this.document.documentElement.lang = config.locale;
    this.title.setTitle(config.title);
    this.updateName('description', config.description);
    this.updateName(
      'robots',
      config.robots ?? 'index,follow,max-image-preview:large'
    );
    this.updateName('twitter:card', 'summary_large_image');
    this.updateName('twitter:title', config.title);
    this.updateName('twitter:description', config.description);
    this.updateName('twitter:image', image);
    this.updateProperty('og:title', config.title);
    this.updateProperty('og:description', config.description);
    this.updateProperty('og:type', config.type ?? 'website');
    this.updateProperty('og:site_name', 'Tickist');
    this.updateProperty('og:url', canonical);
    this.updateProperty('og:image', image);
    this.updateProperty('og:image:alt', config.imageAlt ?? config.title);
    this.updateProperty(
      'og:locale',
      config.locale === 'pl' ? 'pl_PL' : 'en_US'
    );
    this.replaceLink('canonical', canonical);
    this.removeManaged('link[data-blog-alternate="true"]');
    for (const alternate of config.alternates ?? []) {
      this.appendLink(
        'alternate',
        `${SITE_ORIGIN}${alternate.path}`,
        alternate.locale
      );
    }
    this.appendFeed(config.locale);
    this.clearArticleMeta();
    if (config.type === 'article') {
      if (config.publishedAt) {
        this.updateProperty('article:published_time', config.publishedAt);
      }
      if (config.updatedAt) {
        this.updateProperty('article:modified_time', config.updatedAt);
      }
      if (config.category) {
        this.updateProperty('article:section', config.category);
      }
      for (const tag of config.tags ?? []) {
        this.meta.addTag({
          property: 'article:tag',
          content: tag,
          'data-blog-article': 'true',
        });
      }
    }
    this.replaceJsonLd(config.jsonLd ?? []);
  }

  private updateName(name: string, content: string): void {
    this.meta.updateTag({ name, content }, `name='${name}'`);
  }

  private updateProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content }, `property='${property}'`);
  }

  private clearArticleMeta(): void {
    this.removeManaged('meta[data-blog-article="true"]');
    for (const property of [
      'article:published_time',
      'article:modified_time',
      'article:section',
    ]) {
      this.meta.removeTag(`property='${property}'`);
    }
  }

  private replaceLink(rel: string, href: string): void {
    this.document.head.querySelector(`link[rel="${rel}"]`)?.remove();
    this.appendLink(rel, href);
  }

  private appendLink(rel: string, href: string, hreflang?: string): void {
    const link = this.document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (hreflang) {
      link.hreflang = hreflang;
      link.setAttribute('data-blog-alternate', 'true');
    }
    this.document.head.appendChild(link);
  }

  private appendFeed(locale: BlogLocale): void {
    this.removeManaged('link[data-blog-feed="true"]');
    const link = this.document.createElement('link');
    link.rel = 'alternate';
    link.type = 'application/rss+xml';
    link.title = locale === 'pl' ? 'Blog Tickist RSS' : 'Tickist Blog RSS';
    link.href = `/${locale}/blog/feed.xml`;
    link.setAttribute('data-blog-feed', 'true');
    this.document.head.appendChild(link);
  }

  private replaceJsonLd(entries: readonly Record<string, unknown>[]): void {
    this.removeManaged('script[data-blog-json-ld="true"]');
    for (const entry of entries) {
      const script = this.document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-blog-json-ld', 'true');
      script.textContent = JSON.stringify(entry).replace(/</g, '\\u003c');
      this.document.head.appendChild(script);
    }
  }

  private removeManaged(selector: string): void {
    this.document.head
      .querySelectorAll(selector)
      .forEach((element) => element.remove());
  }
}
