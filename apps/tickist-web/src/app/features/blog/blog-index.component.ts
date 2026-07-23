import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import {
  BLOG_LOCALES,
  BLOG_PAGE_SIZE,
  BlogLocale,
  BlogPost,
  findBlogCategory,
  getBlogContent,
  isBlogLocale,
} from './blog-content';
import { BlogSeoService } from './blog-seo.service';

const SITE_ORIGIN = 'https://tickist.com';

@Component({
  standalone: true,
  selector: 'app-blog-index',
  imports: [RouterLink, RouterLinkActive, DatePipe],
  templateUrl: './blog-index.component.html',
  styleUrl: './blog-index.component.css',
})
export class BlogIndexComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(BlogSeoService);
  private readonly routeParams = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly locale = computed<BlogLocale>(() => {
    const locale = this.routeParams().get('locale');
    return isBlogLocale(locale) ? locale : 'en';
  });
  readonly content = computed(() => getBlogContent(this.locale()));
  readonly getBlogContent = getBlogContent;
  readonly otherLocales = computed(() =>
    BLOG_LOCALES.filter((locale) => locale !== this.locale())
  );
  readonly categorySlug = computed(() =>
    this.routeParams().get('categorySlug')
  );
  readonly category = computed(() => {
    const slug = this.categorySlug();
    return slug ? findBlogCategory(this.locale(), slug) : undefined;
  });
  readonly activeTag = computed(
    () => this.queryParams().get('tag')?.trim() ?? ''
  );
  readonly categories = computed(() =>
    this.content().categories.filter((category) =>
      this.content().posts.some((post) => post.category === category.slug)
    )
  );
  readonly filteredPosts = computed(() =>
    this.content().posts.filter(
      (post) =>
        (!this.categorySlug() || post.category === this.categorySlug()) &&
        (!this.activeTag() || post.tags.includes(this.activeTag()))
    )
  );
  readonly page = computed(() =>
    Math.max(1, Number(this.routeParams().get('page') ?? 1))
  );
  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filteredPosts().length / BLOG_PAGE_SIZE))
  );
  readonly posts = computed(() =>
    this.filteredPosts().slice(
      (this.page() - 1) * BLOG_PAGE_SIZE,
      this.page() * BLOG_PAGE_SIZE
    )
  );
  readonly invalid = computed(
    () =>
      (!!this.categorySlug() && !this.category()) ||
      !Number.isInteger(this.page()) ||
      this.page() > this.pageCount()
  );

  constructor() {
    effect(() => this.applyMetadata());
  }

  trackPost(_: number, post: BlogPost): string {
    return post.slug;
  }

  categoryName(slug: string): string {
    return (
      this.content().categories.find((category) => category.slug === slug)
        ?.name ?? slug
    );
  }

  pagePath(page: number): string {
    const base = this.category()
      ? `${this.content().pathPrefix}/category/${this.category()?.slug}`
      : this.content().pathPrefix;
    return page === 1 ? base : `${base}/page/${page}`;
  }

  private applyMetadata(): void {
    const content = this.content();
    const category = this.category();
    const path = this.pagePath(this.page());
    const title = category
      ? `${category.name} | ${content.title}`
      : `${content.title} | Tickist`;
    const description = category?.description ?? content.description;
    this.seo.apply({
      title,
      description,
      path,
      locale: content.locale,
      robots:
        this.activeTag() || this.invalid()
          ? 'noindex,follow'
          : 'index,follow,max-image-preview:large',
      alternates: category
        ? []
        : BLOG_LOCALES.map((locale) => ({
            locale,
            path: getBlogContent(locale).pathPrefix,
          })),
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': category ? 'CollectionPage' : 'Blog',
          name: title,
          description,
          url: `${SITE_ORIGIN}${path}`,
          inLanguage: content.locale,
          publisher: {
            '@type': 'Organization',
            name: 'Tickist',
            url: SITE_ORIGIN,
          },
        },
      ],
    });
  }
}
