# Tickist blog authoring

The Polish and English blogs are independent. Put an article in `pl/` or `en/`
and define its category in the matching `categories.json`.

```md
---
title: A clear article title
slug: clear-article-slug
description: A unique search description between 50 and 160 characters.
publishedAt: 2026-07-24
updatedAt: 2026-07-24
category: productivity
tags:
  - planning
coverImage: /images/blog/en/clear-article-slug/cover.webp
coverImageAlt: Descriptive alternative text
draft: true
---

Article body in Markdown.
```

`draft` must be explicitly set to `false` to publish. Drafts are validated but
excluded from generated application content, the sitemap, and RSS.

Store article images under
`apps/tickist-web/public/images/blog/{locale}/{slug}/`. Use descriptive alt
text, modern formats, and explicit image dimensions in source assets. The cover
should be at least 1200 pixels wide and use the 1200:630 social-sharing ratio.

Run `npm run blog:generate` after changing content. Run `npm run blog:check` to
verify that generated TypeScript, sitemap, robots, and RSS files are current.
