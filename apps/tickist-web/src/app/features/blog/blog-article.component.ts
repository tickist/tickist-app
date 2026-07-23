import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  BlogLocale,
  findBlogArticle,
  findBlogCategory,
  getBlogContent,
  isBlogLocale,
} from './blog-content';
import { BlogSeoService } from './blog-seo.service';

const SITE_ORIGIN = 'https://tickist.com';

@Component({
  standalone: true,
  selector: 'app-blog-article',
  imports: [RouterLink],
  templateUrl: './blog-article.component.html',
  styleUrl: './blog-article.component.css',
})
export class BlogArticleComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(BlogSeoService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly locale = computed<BlogLocale>(() => {
    const locale = this.params().get('locale');
    return isBlogLocale(locale) ? locale : 'en';
  });
  readonly content = computed(() => getBlogContent(this.locale()));
  readonly article = computed(() =>
    findBlogArticle(this.locale(), this.params().get('slug') ?? '')
  );
  readonly category = computed(() => {
    const article = this.article();
    return article
      ? findBlogCategory(this.locale(), article.category)
      : undefined;
  });
  readonly absoluteUrl = computed(
    () => `${SITE_ORIGIN}${this.article()?.url ?? this.content().pathPrefix}`
  );
  readonly copied = signal(false);
  readonly nativeShareAvailable =
    isPlatformBrowser(this.platformId) && typeof navigator.share === 'function';
  readonly encodedUrl = computed(() => encodeURIComponent(this.absoluteUrl()));
  readonly encodedTitle = computed(() =>
    encodeURIComponent(this.article()?.title ?? 'Tickist')
  );

  constructor() {
    effect(() => this.applyMetadata());
  }

  async share(): Promise<void> {
    const article = this.article();
    if (!this.nativeShareAvailable || !article) {
      return;
    }
    try {
      await navigator.share({
        title: article.title,
        url: this.absoluteUrl(),
      });
    } catch {
      // Cancelling the native share sheet is not an application error.
    }
  }

  async copy(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      await navigator.clipboard.writeText(this.absoluteUrl());
    } catch {
      const input = this.document.createElement('textarea');
      input.value = this.absoluteUrl();
      this.document.body.appendChild(input);
      input.select();
      this.document.execCommand('copy');
      input.remove();
    }
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  private applyMetadata(): void {
    const article = this.article();
    const content = this.content();
    if (!article) {
      this.seo.apply({
        title: `${content.article.notFoundTitle} | Tickist`,
        description: content.article.notFoundDescription,
        path: content.pathPrefix,
        locale: content.locale,
        robots: 'noindex,follow',
      });
      return;
    }
    const published = `${article.publishedAt}T00:00:00Z`;
    const modified = article.updatedAt
      ? `${article.updatedAt}T00:00:00Z`
      : null;
    const categoryName = this.category()?.name ?? article.category;
    this.seo.apply({
      title: `${article.title} | Tickist`,
      description: article.description,
      path: article.url,
      locale: article.locale,
      type: 'article',
      image: article.coverImage,
      imageAlt: article.coverImageAlt,
      publishedAt: published,
      updatedAt: modified,
      category: categoryName,
      tags: article.tags,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: article.title,
          description: article.description,
          image: `${SITE_ORIGIN}${article.coverImage}`,
          datePublished: published,
          dateModified: modified ?? published,
          inLanguage: article.locale,
          mainEntityOfPage: this.absoluteUrl(),
          author: {
            '@type': 'Organization',
            name: 'Tickist Team',
            url: SITE_ORIGIN,
          },
          publisher: {
            '@type': 'Organization',
            name: 'Tickist',
            url: SITE_ORIGIN,
          },
          articleSection: categoryName,
          keywords: article.tags.join(', '),
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Tickist',
              item: SITE_ORIGIN,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: content.title,
              item: `${SITE_ORIGIN}${content.pathPrefix}`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: article.title,
              item: this.absoluteUrl(),
            },
          ],
        },
      ],
    });
  }
}
