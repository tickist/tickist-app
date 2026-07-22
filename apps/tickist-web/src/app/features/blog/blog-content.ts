/**
 * Repository-owned public blog content.
 *
 * Each locale owns an independent registry. Do not add translation keys or
 * infer an equivalent post in another locale: an English post and a Polish
 * post are separate editorial records, even when they cover a similar topic.
 */
export const BLOG_LOCALES = ['en', 'pl'] as const;

export type BlogLocale = (typeof BLOG_LOCALES)[number];

export interface BlogCategory {
  slug: string;
  name: string;
  description: string;
}

export interface BlogTag {
  slug: string;
  name: string;
}

export interface BlogPostSeo {
  title: string;
  description: string;
  imageUrl?: string;
  noIndex?: boolean;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  updatedAt?: string;
  readingTimeMinutes: number;
  categorySlug: string;
  tagSlugs: readonly string[];
  seo: BlogPostSeo;
  /** Repository-relative Markdown source for the article body. */
  sourcePath: string;
}

export interface BlogLocaleContent {
  locale: BlogLocale;
  name: string;
  pathPrefix: `/${BlogLocale}/blog`;
  title: string;
  description: string;
  emptyState: {
    eyebrow: string;
    title: string;
    description: string;
    readingTimeLabel: string;
  };
  navigation: {
    homeLabel: string;
    signUpLabel: string;
  };
  categories: readonly BlogCategory[];
  tags: readonly BlogTag[];
  posts: readonly BlogPost[];
}

/**
 * Add posts, categories, and tags to the matching locale only. A locale's
 * arrays are deliberately separate to keep editorial calendars independent.
 */
export const BLOG_CONTENT_BY_LOCALE: Readonly<
  Record<BlogLocale, BlogLocaleContent>
> = {
  en: {
    locale: 'en',
    name: 'English',
    pathPrefix: '/en/blog',
    title: 'Tickist Blog',
    description:
      'Practical guides for calmer task management, focused projects, and sustainable productivity.',
    emptyState: {
      eyebrow: 'Coming soon',
      title: 'The first articles are being prepared.',
      description:
        'Tickist articles are published from this open-source repository. This language edition has its own editorial catalogue.',
      readingTimeLabel: 'min read',
    },
    navigation: {
      homeLabel: 'Tickist home',
      signUpLabel: 'Create a free workspace',
    },
    categories: [],
    tags: [],
    posts: [],
  },
  pl: {
    locale: 'pl',
    name: 'Polski',
    pathPrefix: '/pl/blog',
    title: 'Blog Tickist',
    description:
      'Praktyczne wskazówki o spokojniejszym zarządzaniu zadaniami, projektami i produktywności.',
    emptyState: {
      eyebrow: 'Wkrótce',
      title: 'Pierwsze artykuły są w przygotowaniu.',
      description:
        'Artykuły Tickist są publikowane z tego otwartego repozytorium. Ta wersja językowa ma własny katalog redakcyjny.',
      readingTimeLabel: 'min czytania',
    },
    navigation: {
      homeLabel: 'Strona główna Tickist',
      signUpLabel: 'Utwórz darmową przestrzeń',
    },
    categories: [],
    tags: [],
    posts: [],
  },
};

export function isBlogLocale(value: string | null): value is BlogLocale {
  return value !== null && BLOG_LOCALES.some((locale) => locale === value);
}

export function getBlogContent(locale: BlogLocale): BlogLocaleContent {
  return BLOG_CONTENT_BY_LOCALE[locale];
}
