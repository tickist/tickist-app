import { GENERATED_BLOG_CONTENT } from './blog-content.generated';

export const BLOG_LOCALES = ['en', 'pl'] as const;
export const BLOG_PAGE_SIZE = 12;

export type BlogLocale = (typeof BLOG_LOCALES)[number];

export interface BlogHeading {
  readonly depth: 2 | 3;
  readonly id: string;
  readonly text: string;
}

export interface BlogCategory {
  readonly locale: BlogLocale;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
}

export interface BlogPost {
  readonly locale: BlogLocale;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly publishedAt: string;
  readonly updatedAt: string | null;
  readonly readingMinutes: number;
  readonly category: string;
  readonly tags: readonly string[];
  readonly coverImage: string;
  readonly coverImageAlt: string;
  readonly bodyHtml: string;
  readonly headings: readonly BlogHeading[];
  readonly url: string;
}

export interface BlogGeneratedContent {
  readonly articles: readonly BlogPost[];
  readonly categories: readonly BlogCategory[];
}

export interface BlogLocaleContent {
  readonly locale: BlogLocale;
  readonly name: string;
  readonly pathPrefix: `/${BlogLocale}/blog`;
  readonly title: string;
  readonly description: string;
  readonly emptyState: {
    readonly eyebrow: string;
    readonly title: string;
    readonly description: string;
    readonly readingTimeLabel: string;
  };
  readonly navigation: {
    readonly homeLabel: string;
    readonly signUpLabel: string;
    readonly allCategoriesLabel: string;
    readonly backToBlogLabel: string;
  };
  readonly article: {
    readonly updatedLabel: string;
    readonly contentsLabel: string;
    readonly shareLabel: string;
    readonly copyLabel: string;
    readonly copiedLabel: string;
    readonly notFoundTitle: string;
    readonly notFoundDescription: string;
  };
  readonly categories: readonly BlogCategory[];
  readonly posts: readonly BlogPost[];
}

const LOCALE_UI: Readonly<
  Record<BlogLocale, Omit<BlogLocaleContent, 'categories' | 'posts'>>
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
      allCategoriesLabel: 'All articles',
      backToBlogLabel: 'Back to the blog',
    },
    article: {
      updatedLabel: 'Updated',
      contentsLabel: 'On this page',
      shareLabel: 'Share',
      copyLabel: 'Copy link',
      copiedLabel: 'Copied',
      notFoundTitle: 'Article not found',
      notFoundDescription:
        'This article does not exist or is not published in the English edition.',
    },
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
      allCategoriesLabel: 'Wszystkie artykuły',
      backToBlogLabel: 'Wróć do bloga',
    },
    article: {
      updatedLabel: 'Aktualizacja',
      contentsLabel: 'Na tej stronie',
      shareLabel: 'Udostępnij',
      copyLabel: 'Kopiuj link',
      copiedLabel: 'Skopiowano',
      notFoundTitle: 'Nie znaleziono artykułu',
      notFoundDescription:
        'Ten artykuł nie istnieje albo nie został opublikowany w polskiej wersji.',
    },
  },
};

export const BLOG_CONTENT_BY_LOCALE: Readonly<
  Record<BlogLocale, BlogLocaleContent>
> = {
  en: {
    ...LOCALE_UI.en,
    categories: GENERATED_BLOG_CONTENT.categories.filter(
      (category) => category.locale === 'en'
    ),
    posts: GENERATED_BLOG_CONTENT.articles.filter(
      (article) => article.locale === 'en'
    ),
  },
  pl: {
    ...LOCALE_UI.pl,
    categories: GENERATED_BLOG_CONTENT.categories.filter(
      (category) => category.locale === 'pl'
    ),
    posts: GENERATED_BLOG_CONTENT.articles.filter(
      (article) => article.locale === 'pl'
    ),
  },
};

export function isBlogLocale(value: string | null): value is BlogLocale {
  return value !== null && BLOG_LOCALES.some((locale) => locale === value);
}

export function getBlogContent(locale: BlogLocale): BlogLocaleContent {
  return BLOG_CONTENT_BY_LOCALE[locale];
}

export function findBlogArticle(
  locale: BlogLocale,
  slug: string
): BlogPost | undefined {
  return getBlogContent(locale).posts.find((post) => post.slug === slug);
}

export function findBlogCategory(
  locale: BlogLocale,
  slug: string
): BlogCategory | undefined {
  return getBlogContent(locale).categories.find(
    (category) => category.slug === slug
  );
}
