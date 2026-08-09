# Public content, crawlers, and LLM discovery

## Public routes

Tickist exposes these indexable public pages:

- `https://tickist.com/` — product landing page;
- `https://tickist.com/en/blog` — English blog index;
- `https://tickist.com/pl/blog` — Polish blog index.
- `https://tickist.com/{locale}/blog/{slug}` — generated, published blog articles;
- populated category archives and required pagination routes generated from published articles.

The blog editions have independent editorial catalogues. Do not create alternate-language or `hreflang` mappings for future article URLs unless the editorial team explicitly links those records.

The following are not indexable content:

- `/app/**` — authenticated user workspace;
- `/auth/**` — transactional sign-in and recovery flows;
- `/mcp` — technical MCP endpoint;
- `/env.js` — public runtime configuration asset.

## Static metadata files

The following deploy from `apps/tickist-web/public/` to the web root:

| File           | URL             | Role                                               |
| -------------- | --------------- | -------------------------------------------------- |
| `sitemap.xml`  | `/sitemap.xml`  | Canonical list of indexable public pages.          |
| `robots.txt`   | `/robots.txt`   | Crawl policy and sitemap discovery.                |
| `llm.txt`      | `/llm.txt`      | Concise project discovery for LLMs.                |
| `llm-full.txt` | `/llm-full.txt` | Complete product and technical reference for LLMs. |

## Update procedure

When adding, changing, or removing a public route:

1. decide whether it is genuinely public and indexable;
2. update Markdown/front matter and run `npm run blog:generate` for blog routes, or edit the relevant static metadata for other routes;
3. revise `robots.txt` if crawl permissions change;
4. update `llm.txt`, `llm-full.txt`, and the relevant `doc/` page;
5. verify the files are included in the production build.

For a new blog article, follow `doc/blog.md`. Drafts stay out of crawl output. Published articles, categories, pagination, and RSS are generated automatically. The production Worker must inject canonical metadata from the generated registry into initial HTML, and Angular must mirror it after client navigation.

Do not add private or parameterised user data to a sitemap. Never list one-time password reset URLs, project IDs, task IDs, API endpoints, or runtime-secret paths.
