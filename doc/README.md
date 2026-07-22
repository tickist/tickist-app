# Tickist knowledge base

This directory is the English, repository-native knowledge base for coding agents and other LLM-assisted tools. It describes the product and its operating constraints; it is not a replacement for source code, tests, or database migrations.

## Read in this order

1. [Product features](product-features.md) — user-facing behaviour and vocabulary.
2. [Architecture](architecture.md) — frontend, data, security, and integration boundaries.
3. [Edge Functions](edge-functions.md) — server-side automation endpoints and their access model.
4. [Operations](operations.md) — local development, tests, database workflow, and deployment.
5. [Public content](public-content.md) — sitemap, robots, LLM files, and indexing rules.
6. [Public blog](blog.md) — repository-authored multilingual blog, taxonomy, and SEO rules.

## Maintenance contract

Keep these documents factual and concise. When a product capability changes, update the relevant page and both public LLM files:

- `apps/tickist-web/public/llm.txt`
- `apps/tickist-web/public/llm-full.txt`

When a public, indexable route is added, changed, or removed, update:

- `apps/tickist-web/public/sitemap.xml`
- `apps/tickist-web/public/robots.txt`

Do not add authenticated workspace routes, account flows, MCP endpoints, runtime configuration, or user-generated routes to the sitemap.
