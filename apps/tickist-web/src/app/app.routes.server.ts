import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';
import {
  BLOG_LOCALES,
  BLOG_PAGE_SIZE,
  BlogLocale,
  getBlogContent,
} from './features/blog/blog-content';

export const serverRoutes: ServerRoute[] = [
  ...BLOG_LOCALES.flatMap(blogServerRoutes),
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];

function blogServerRoutes(locale: BlogLocale): ServerRoute[] {
  const content = getBlogContent(locale);
  const categories = content.categories.filter((category) =>
    content.posts.some((post) => post.category === category.slug)
  );
  const archivePages = Array.from(
    {
      length: Math.max(0, Math.ceil(content.posts.length / BLOG_PAGE_SIZE) - 1),
    },
    (_, index) => ({ page: String(index + 2) })
  );
  const categoryPages = categories.flatMap((category) => {
    const total = content.posts.filter(
      (post) => post.category === category.slug
    ).length;
    return Array.from(
      {
        length: Math.max(0, Math.ceil(total / BLOG_PAGE_SIZE) - 1),
      },
      (_, index) => ({
        categorySlug: category.slug,
        page: String(index + 2),
      })
    );
  });

  return [
    {
      path: `${locale}/blog`,
      renderMode: RenderMode.Prerender,
    },
    {
      path: `${locale}/blog/page/:page`,
      renderMode: RenderMode.Prerender,
      fallback: PrerenderFallback.None,
      getPrerenderParams: async () => archivePages,
    },
    {
      path: `${locale}/blog/category/:categorySlug/page/:page`,
      renderMode: RenderMode.Prerender,
      fallback: PrerenderFallback.None,
      getPrerenderParams: async () => categoryPages,
    },
    {
      path: `${locale}/blog/category/:categorySlug`,
      renderMode: RenderMode.Prerender,
      fallback: PrerenderFallback.None,
      getPrerenderParams: async () =>
        categories.map((category) => ({ categorySlug: category.slug })),
    },
    {
      path: `${locale}/blog/:slug`,
      renderMode: RenderMode.Prerender,
      fallback: PrerenderFallback.None,
      getPrerenderParams: async () =>
        content.posts.map((post) => ({ slug: post.slug })),
    },
  ];
}
