---
name: add-tickist-blog-post
description: Create a repository-backed Polish or English Tickist blog draft from supplied Markdown or article text. Use when the user asks to add, import, prepare, or save a Tickist blog entry, including requests that provide only an .md file and plan to add images later.
---

# Add Tickist Blog Post

Create a real Markdown entry in the repository. Keep Polish and English as
independent editorial collections. Always create a draft unless publication is
explicitly requested.

## Workflow

1. Read `AGENTS.md`, `doc/blog.md`, and
   `apps/tickist-web/content/blog/README.md`.
2. Read the supplied Markdown completely. Determine `pl` or `en` from the
   explicit request. Infer it from the article language only when unambiguous.
3. Derive a lowercase kebab-case slug. Check that the same filename does not
   already exist in the selected locale.
4. Review the locale's `categories.json`. Reuse an existing category when it
   clearly fits. Do not silently invent a category; explain when the catalogue
   needs a new entry.
5. Create
   `apps/tickist-web/content/blog/{locale}/{slug}.md`. Do not leave the supplied
   file outside the content collection as the only copy.
6. Preserve the article's meaning and headings. Add or normalize front matter:
   `title`, `slug`, `description`, `publishedAt`, optional `updatedAt`,
   `category`, `tags`, `coverImage`, `coverImageAlt`, and `draft`.
7. Set `coverImage` to
   `/images/blog/{locale}/{slug}/cover.webp` and always set `draft: true`.
   Never publish merely because the Markdown looks complete. Use today's
   verified date only when the source does not specify a date.
8. Keep body images as standard Markdown using paths under
   `/images/blog/{locale}/{slug}/`. Require descriptive alt text. Do not create
   or fabricate image files or image descriptions as part of this skill.
9. Run `npm run blog:generate` and `npm run blog:check`. Confirm that the draft
   remains absent from generated public articles, sitemap, and RSS.
10. Report the created Markdown path and future image locations under
    `apps/tickist-web/public/images/blog/{locale}/{slug}/`.

## Publishing

Publish only when the user explicitly asks. Before changing `draft` to
`false`, confirm that every image exists, the cover is at least 1200 pixels
wide in the 1200:630 ratio, and all metadata is final. Then run the blog
generator, focused tests, lint, and a production build. Review the generated
article registry, sitemap, RSS, prerendered route, canonical metadata, and
structured data.

## Guardrails

- Never create or require a translated counterpart.
- Never change `draft` to `false` without an explicit publication request.
- Do not fabricate an image, alt text describing an unseen image, category, or
  article fact. Use a clear `TODO` value only in a draft and report it.
- Keep the SEO description unique and between 50 and 160 characters.
- Use one H1 in front matter/title context; structure the body with H2/H3.
- Do not add a CMS, database record, comments, or social tracking SDK.
- For publication changes, update `doc/blog.md`, `llm.txt`, `llm-full.txt`, and
  public SEO artifacts as required by `AGENTS.md`.
