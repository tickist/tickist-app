# Tickist knowledge base

This directory is the English, repository-native knowledge base for coding agents and other LLM-assisted tools. It describes the product and its operating constraints; it is not a replacement for source code, tests, or database migrations.

## Choose by task

- [Product features](product-features.md) — user-facing behaviour and vocabulary.
- [Architecture](architecture.md) — frontend, data, security, and integration boundaries.
- [Edge Functions](edge-functions.md) — server-side automation endpoints and their access model.
- [Operations](operations.md) — local development, tests, database workflow, and deployment.
- [Demo data seeding](demo-data-seeding.md) — deterministic English demonstration account and safety controls.
- [Encrypted database backups](encrypted-database-backups.md) — complete Supabase export, encryption, and recovery contract.
- [Public content](public-content.md) — sitemap, robots, LLM files, and indexing rules.
- [Public blog](blog.md) — repository-authored multilingual blog, taxonomy, and SEO rules.

Read the page that governs the change; no sequential tour is required. For repository instructions, skills, and hooks, use [Agent tooling](agent-tooling.md).

## Maintenance contract

Keep these documents factual and concise. When a product capability changes, update the relevant page and both public LLM files:

- `apps/tickist-web/public/llm.txt`
- `apps/tickist-web/public/llm-full.txt`

When a public, indexable route is added, changed, or removed, update:

- `apps/tickist-web/public/sitemap.xml`
- `apps/tickist-web/public/robots.txt`

Do not add authenticated workspace routes, account flows, MCP endpoints, runtime configuration, or user-generated routes to the sitemap.
