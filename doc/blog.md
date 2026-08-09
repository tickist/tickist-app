# Public blog

## Purpose and boundaries

The public blog lives outside the authenticated Tickist workspace. It is for visitors who are not signed in and is available at:

- `https://tickist.com/en/blog`;
- `https://tickist.com/pl/blog`.

There is no administration panel, database table, authentication requirement, or comment system in the first version. Articles are version-controlled application content. This keeps publication reviewable, deployable with the application, and free from runtime CMS dependencies.

## Locales and editorial independence

The English and Polish editions are independent editorial catalogues. They are not translations of one another and must not share a translation key or implicit post mapping. A post may exist only in one locale; similarly named posts in two locales remain separate records.

The authoring source of truth is `apps/tickist-web/content/blog/`:

- `en/` and `pl/` contain independent Markdown articles;
- each locale owns a separate `categories.json`;
- `tools/scripts/generate-blog-content.mjs` validates front matter, sanitizes rendered HTML, calculates reading time, and writes the application registry plus public crawl artifacts;
- `blog-content.generated.ts` is generated output and must not be edited manually.

Start with empty category arrays when a language has no posts. Do not create placeholder articles only to populate a category or tag.

## Adding an article

When adding the first or a subsequent article, make one coherent repository change:

1. create `apps/tickist-web/content/blog/{locale}/{slug}.md` with the front matter documented in that directory's `README.md`;
2. add or reuse a category only in the matching locale's `categories.json`;
3. keep `draft: true` while copy, metadata, or images are incomplete;
4. store article images under `apps/tickist-web/public/images/blog/{locale}/{slug}/`;
5. set `draft: false` only after an explicit publication decision;
6. run `npm run blog:generate` and `npm run blog:check`;
7. run the focused tests, lint, and production build, then inspect the prerendered article metadata;
8. update this document, `llm.txt`, and `llm-full.txt` when the publication contract changes.

Drafts are validated but do not enter the generated registry, sitemap, or RSS. Published articles automatically receive a public `/{locale}/blog/{slug}` route, category and tag navigation, reading time, table of contents, sharing controls, canonical metadata, `BlogPosting` JSON-LD, sitemap entry, and locale RSS item. Category archives and pagination are generated from the same content registry. `hreflang` is not added between individual posts unless a deliberate relationship is introduced in a future schema.

Do not add comments in the first version. Social sharing belongs on a public article detail page, not on an empty blog index; use canonical HTTPS URLs and encoded title/URL query parameters when that page is introduced.

## SEO and performance baseline

The production Cloudflare Worker injects locale-specific title, description, canonical URL, robots directive, Open Graph, Twitter-card, RSS discovery, and JSON-LD metadata into the initial SPA HTML. Angular mirrors the same metadata after client navigation. The Worker derives article and category metadata from the generated registry instead of maintaining a second manual content list.

The blog index is lazy loaded, uses no remote font or image dependency, and has a responsive one-column mobile layout. When article media is added, provide explicit dimensions, modern formats, meaningful `alt` text, and avoid loading below-the-fold images eagerly.

The generated sitemap includes both blog indexes and every published article, category archive, and pagination route. Generated `robots.txt` allows public blog pages while excluding the private workspace, authentication, MCP, and runtime configuration routes. Locale feeds are available at `/en/blog/feed.xml` and `/pl/blog/feed.xml`.
