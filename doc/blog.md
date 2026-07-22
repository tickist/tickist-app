# Public blog

## Purpose and boundaries

The public blog lives outside the authenticated Tickist workspace. It is for visitors who are not signed in and is available at:

- `https://tickist.com/en/blog`;
- `https://tickist.com/pl/blog`.

There is no administration panel, database table, authentication requirement, or comment system in the first version. Articles are version-controlled application content. This keeps publication reviewable, deployable with the application, and free from runtime CMS dependencies.

## Locales and editorial independence

The English and Polish editions are independent editorial catalogues. They are not translations of one another and must not share a translation key or implicit post mapping. A post may exist only in one locale; similarly named posts in two locales remain separate records.

The source of truth is `apps/tickist-web/src/app/features/blog/blog-content.ts`:

- `BLOG_CONTENT_BY_LOCALE.en` owns English categories, tags, and posts;
- `BLOG_CONTENT_BY_LOCALE.pl` owns Polish categories, tags, and posts;
- every `BlogPost` carries its locale-specific slug, metadata, category, tags, publication date, update date, SEO fields, and repository source path.

Start with empty arrays when a language has no posts. Do not create placeholder articles only to populate a category or tag.

## Adding an article

When adding the first or a subsequent article, make one coherent repository change:

1. add the article source under a locale-specific repository path and reference it from the matching `BlogPost.sourcePath`;
2. add or reuse a category and tags only in that locale's registry;
3. add the post metadata to that same locale's `posts` array, including a unique slug, ISO publication date, short excerpt, reading time, and accurate `seo` title and description;
4. implement or update the article renderer and static metadata for its canonical route before exposing the post in the index;
5. add an entry to `sitemap.xml` only when the article route is public and indexable; add `hreflang` links only for deliberately related language versions, never by name or slug coincidence;
6. add a regression test and update `doc/`, `llm.txt`, and `llm-full.txt`.

Do not add comments in the first version. Social sharing belongs on a public article detail page, not on an empty blog index; use canonical HTTPS URLs and encoded title/URL query parameters when that page is introduced.

## SEO and performance baseline

The Cloudflare Worker injects locale-specific title, description, canonical URL, robots directive, Open Graph, Twitter-card, and JSON-LD `CollectionPage` metadata into the initial HTML for both blog indexes. Angular mirrors that metadata after client navigation.

The blog index is lazy loaded, uses no remote font or image dependency, and has a responsive one-column mobile layout. When article media is added, provide explicit dimensions, modern formats, meaningful `alt` text, and avoid loading below-the-fold images eagerly.

The sitemap includes both blog index routes. `robots.txt` allows public blog pages while continuing to exclude user workspace, account, MCP, and runtime configuration routes.
