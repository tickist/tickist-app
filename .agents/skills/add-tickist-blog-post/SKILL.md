---
name: add-tickist-blog-post
description: Import supplied article text or Markdown into a Polish or English Tickist blog draft.
---

# Tickist blog import

Use `doc/blog.md` for the editorial/SEO contract and `apps/tickist-web/content/blog/README.md` for the file schema when needed. Create the entry under `apps/tickist-web/content/blog/{locale}/{slug}.md`; the supplied file outside that collection is not an imported entry.

## Draft

- Read the supplied text completely. Preserve its meaning and headings. Use the requested locale; infer it only when the language is unambiguous.
- Choose a unique lowercase kebab-case slug and a suitable category from that locale's registry. Explain a necessary taxonomy extension rather than silently inventing it.
- Supply schema-valid title, description, dates, category, tags, and cover metadata. Keep the SEO description unique and 50–160 characters; use body H2/H3 under the title.
- Default to `draft: true`. Use the supplied date, or today's verified date if absent.
- Put future cover/body image paths under `/images/blog/{locale}/{slug}/`; the default cover is `cover.webp`. Missing images are allowed in drafts. Use clear TODO metadata for unseen images rather than fabricating alt text or assets.
- Run `npm run blog:generate` and `npm run blog:check`; verify the draft stays out of generated public articles, sitemap, and RSS.
- Follow `AGENTS.md` for affected editorial documentation. Report the Markdown path and missing image locations.

## Explicit publication

Publication is authorized by the user's request, not by article completeness. Verify final metadata and every image, including a cover at least 1200 pixels wide with a 1200:630 ratio. Run the generator and relevant blog tests/build checks. Inspect the public registry, sitemap/RSS, rendered article, canonical/social metadata, and structured data.

Polish and English remain separate editorial collections. Do not create translations or cross-language equivalents unless requested; add hreflang only for intentionally paired articles. Do not add a CMS, database records, comments, or tracking SDKs.
