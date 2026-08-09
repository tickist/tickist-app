import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'apps/tickist-web/content/blog');
const PUBLIC_ROOT = path.join(ROOT, 'apps/tickist-web/public');
const GENERATED_TS = path.join(
  ROOT,
  'apps/tickist-web/src/app/features/blog/blog-content.generated.ts'
);
const LOCALES = ['en', 'pl'];
const SITE_URL = 'https://tickist.com';
const PAGE_SIZE = 12;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function requiredString(data, field, file) {
  const value = data[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${file}: ${field} must be a non-empty string.`);
  }
  return value.trim();
}

function isoDate(data, field, file, optional = false) {
  const value = data[field];
  if (optional && (value === undefined || value === null || value === '')) {
    return null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const normalized = requiredString(data, field, file);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(normalized) ||
    Number.isNaN(Date.parse(normalized))
  ) {
    throw new Error(`${file}: ${field} must use YYYY-MM-DD.`);
  }
  return normalized;
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

export function extractHeadings(markdown) {
  const used = new Map();
  return markdown
    .split(/\r?\n/)
    .map((line) => /^(#{2,3})\s+(.+?)\s*$/.exec(line))
    .filter(Boolean)
    .map((match) => {
      const text = match[2].replace(/[*_`[\]]/g, '').trim();
      const base = slugify(text) || 'section';
      const occurrence = (used.get(base) ?? 0) + 1;
      used.set(base, occurrence);
      return {
        depth: match[1].length,
        id: occurrence === 1 ? base : `${base}-${occurrence}`,
        text,
      };
    });
}

export function renderMarkdown(markdown, headings) {
  let headingIndex = 0;
  const renderer = new marked.Renderer();
  renderer.heading = ({ tokens, depth }) => {
    const text = renderer.parser.parseInline(tokens);
    const heading =
      depth === 2 || depth === 3 ? headings[headingIndex++] : undefined;
    return `<h${depth}${
      heading ? ` id="${heading.id}"` : ''
    }>${text}</h${depth}>\n`;
  };
  renderer.image = ({ href, title, text }) => {
    if (!href.startsWith('/images/blog/')) {
      throw new Error(`Blog images must live under /images/blog/: ${href}`);
    }
    if (!text.trim()) {
      throw new Error(`${href}: blog images require descriptive alt text.`);
    }
    const caption = title
      ? `<figcaption>${escapeAttribute(title)}</figcaption>`
      : '';
    return `<figure class="article-image"><img src="${escapeAttribute(
      href
    )}" alt="${escapeAttribute(
      text
    )}" loading="lazy" decoding="async">${caption}</figure>`;
  };
  const rendered = marked.parse(markdown, { gfm: true, renderer });
  return sanitizeHtml(String(rendered), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img',
      'figure',
      'figcaption',
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ['href', 'title', 'rel'],
      img: ['src', 'alt', 'loading', 'decoding'],
      figure: ['class'],
      h2: ['id'],
      h3: ['id'],
      code: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

async function loadCategories(locale) {
  const file = path.join(CONTENT_ROOT, locale, 'categories.json');
  const parsed = JSON.parse(await readFile(file, 'utf8'));
  if (!Array.isArray(parsed)) {
    throw new Error(`${file}: expected an array.`);
  }
  const seen = new Set();
  return parsed.map((entry) => {
    const slug = requiredString(entry, 'slug', file);
    const name = requiredString(entry, 'name', file);
    const description = requiredString(entry, 'description', file);
    if (!SLUG_PATTERN.test(slug)) {
      throw new Error(`${file}: invalid category slug ${slug}.`);
    }
    if (seen.has(slug)) {
      throw new Error(`${file}: duplicate category slug ${slug}.`);
    }
    seen.add(slug);
    return { locale, slug, name, description };
  });
}

async function loadArticles(locale, categories) {
  const directory = path.join(CONTENT_ROOT, locale);
  const entries = (await readdir(directory))
    .filter((name) => name.endsWith('.md'))
    .sort();
  const categorySlugs = new Set(categories.map((category) => category.slug));
  const slugs = new Set();
  const articles = [];

  for (const name of entries) {
    const file = path.join(directory, name);
    const parsed = matter(await readFile(file, 'utf8'));
    const title = requiredString(parsed.data, 'title', file);
    const slug = requiredString(parsed.data, 'slug', file);
    const description = requiredString(parsed.data, 'description', file);
    const publishedAt = isoDate(parsed.data, 'publishedAt', file);
    const updatedAt = isoDate(parsed.data, 'updatedAt', file, true);
    const category = requiredString(parsed.data, 'category', file);
    const coverImage = requiredString(parsed.data, 'coverImage', file);
    const coverImageAlt = requiredString(parsed.data, 'coverImageAlt', file);
    const tags = Array.isArray(parsed.data.tags)
      ? [
          ...new Set(
            parsed.data.tags.map((tag) => String(tag).trim()).filter(Boolean)
          ),
        ]
      : [];

    if (!SLUG_PATTERN.test(slug) || path.basename(name, '.md') !== slug) {
      throw new Error(`${file}: slug must match the kebab-case filename.`);
    }
    if (slugs.has(slug)) {
      throw new Error(`${file}: duplicate article slug ${slug}.`);
    }
    if (!categorySlugs.has(category)) {
      throw new Error(`${file}: unknown category ${category}.`);
    }
    if (description.length < 50 || description.length > 160) {
      throw new Error(`${file}: description must contain 50-160 characters.`);
    }
    if (updatedAt && updatedAt < publishedAt) {
      throw new Error(`${file}: updatedAt cannot precede publishedAt.`);
    }
    if (!coverImage.startsWith(`/images/blog/${locale}/${slug}/`)) {
      throw new Error(
        `${file}: coverImage must live under /images/blog/${locale}/${slug}/.`
      );
    }

    slugs.add(slug);
    const headings = extractHeadings(parsed.content);
    const bodyHtml = renderMarkdown(parsed.content, headings);
    if (/^#\s+/m.test(parsed.content)) {
      throw new Error(
        `${file}: the article title is the only H1; body headings must start at H2.`
      );
    }
    if (parsed.data.draft !== false) {
      continue;
    }
    if (/^TODO\b/i.test(coverImageAlt)) {
      throw new Error(
        `${file}: replace the cover image alt text before publishing.`
      );
    }
    const publicImages = [
      coverImage,
      ...Array.from(
        parsed.content.matchAll(
          /!\[[^\]]*\]\((\/images\/blog\/[^\s)]+)(?:\s+["'][^"']*["'])?\)/g
        ),
        (match) => match[1]
      ),
    ];
    for (const image of publicImages) {
      await access(path.join(PUBLIC_ROOT, image.slice(1))).catch(() => {
        throw new Error(`${file}: missing public image ${image}.`);
      });
    }
    const words = parsed.content.trim().split(/\s+/).filter(Boolean).length;
    articles.push({
      locale,
      title,
      slug,
      description,
      publishedAt,
      updatedAt,
      category,
      tags,
      coverImage,
      coverImageAlt,
      bodyHtml,
      headings,
      readingMinutes: Math.max(1, Math.ceil(words / 220)),
      url: `/${locale}/blog/${slug}`,
    });
  }
  return articles.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function generatedTypescript(content) {
  return `import type { BlogGeneratedContent } from './blog-content';\n\n// Generated by tools/scripts/generate-blog-content.mjs. Do not edit manually.\nexport const GENERATED_BLOG_CONTENT: BlogGeneratedContent = ${JSON.stringify(
    content,
    null,
    2
  )};\n`;
}

function sitemap(content) {
  const archivePages = LOCALES.flatMap((locale) => {
    const total = content.articles.filter(
      (article) => article.locale === locale
    ).length;
    return Array.from(
      { length: Math.max(0, Math.ceil(total / PAGE_SIZE) - 1) },
      (_, index) => ({
        path: `/${locale}/blog/page/${index + 2}`,
        modified: null,
      })
    );
  });
  const categoryPages = content.categories.flatMap((category) => {
    const total = content.articles.filter(
      (article) =>
        article.locale === category.locale && article.category === category.slug
    ).length;
    return Array.from(
      { length: Math.max(0, Math.ceil(total / PAGE_SIZE) - 1) },
      (_, index) => ({
        path: `/${category.locale}/blog/category/${category.slug}/page/${
          index + 2
        }`,
        modified: null,
      })
    );
  });
  const urls = [
    { path: '/', modified: null, alternates: false },
    ...LOCALES.map((locale) => ({
      path: `/${locale}/blog`,
      modified: null,
      alternates: true,
    })),
    ...content.articles.map((article) => ({
      path: article.url,
      modified: article.updatedAt ?? article.publishedAt,
    })),
    ...content.categories
      .filter((category) =>
        content.articles.some(
          (article) =>
            article.locale === category.locale &&
            article.category === category.slug
        )
      )
      .map((category) => ({
        path: `/${category.locale}/blog/category/${category.slug}`,
        modified: null,
      })),
    ...archivePages,
    ...categoryPages,
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls
    .map(
      ({ path: urlPath, modified, alternates = false }) =>
        `  <url>\n    <loc>${SITE_URL}${urlPath}</loc>${
          modified ? `\n    <lastmod>${modified}</lastmod>` : ''
        }${
          alternates
            ? `\n    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}/en/blog" />\n    <xhtml:link rel="alternate" hreflang="pl" href="${SITE_URL}/pl/blog" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/en/blog" />`
            : ''
        }\n    <changefreq>${
          urlPath === '/' || alternates ? 'weekly' : 'monthly'
        }</changefreq>\n    <priority>${
          urlPath === '/' ? '1.0' : alternates ? '0.8' : '0.7'
        }</priority>\n  </url>`
    )
    .join('\n')}\n</urlset>\n`;
}

function robots() {
  return `# Generated by tools/scripts/generate-blog-content.mjs.\nUser-agent: *\nAllow: /\nAllow: /en/blog\nAllow: /pl/blog\n\nDisallow: /app/\nDisallow: /auth/\nDisallow: /mcp\nDisallow: /env.js\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}

function rss(locale, articles) {
  const title = locale === 'pl' ? 'Blog Tickist' : 'Tickist Blog';
  const description =
    locale === 'pl'
      ? 'Praktyczne wskazówki o zarządzaniu zadaniami i produktywności.'
      : 'Practical task-management and productivity articles.';
  const escape = (value) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  const items = articles
    .filter((article) => article.locale === locale)
    .map(
      (article) =>
        `    <item>\n      <title>${escape(
          article.title
        )}</title>\n      <link>${SITE_URL}${
          article.url
        }</link>\n      <guid>${SITE_URL}${
          article.url
        }</guid>\n      <description>${escape(
          article.description
        )}</description>\n      <pubDate>${new Date(
          `${article.publishedAt}T00:00:00Z`
        ).toUTCString()}</pubDate>\n    </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${title}</title>\n    <link>${SITE_URL}/${locale}/blog</link>\n    <description>${description}</description>\n    <language>${locale}</language>${
    items ? `\n${items}` : ''
  }\n  </channel>\n</rss>\n`;
}

async function buildOutputs() {
  const categories = (await Promise.all(LOCALES.map(loadCategories))).flat();
  const articles = (
    await Promise.all(
      LOCALES.map((locale) =>
        loadArticles(
          locale,
          categories.filter((category) => category.locale === locale)
        )
      )
    )
  ).flat();
  const content = { articles, categories };
  return new Map([
    [GENERATED_TS, generatedTypescript(content)],
    [path.join(PUBLIC_ROOT, 'sitemap.xml'), sitemap(content)],
    [path.join(PUBLIC_ROOT, 'robots.txt'), robots()],
    ...LOCALES.map((locale) => [
      path.join(PUBLIC_ROOT, locale, 'blog', 'feed.xml'),
      rss(locale, articles),
    ]),
  ]);
}

async function main() {
  const check = process.argv.includes('--check');
  const outputs = await buildOutputs();
  const stale = [];
  for (const [file, content] of outputs) {
    if (check) {
      const current = await readFile(file, 'utf8').catch(() => '');
      if (current !== content) {
        stale.push(path.relative(ROOT, file));
      }
    } else {
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, content);
    }
  }
  if (stale.length) {
    throw new Error(
      `Generated blog artifacts are stale:\n- ${stale.join(
        '\n- '
      )}\nRun npm run blog:generate.`
    );
  }
  console.log(
    check ? 'Blog artifacts are current.' : 'Blog artifacts generated.'
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
