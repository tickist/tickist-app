import { describe, expect, test } from 'vitest';
import {
  BLOG_CONTENT_BY_LOCALE,
  getBlogContent,
  isBlogLocale,
} from './blog-content';

describe('blog content registry', () => {
  test('keeps each locale in an independent editorial registry', () => {
    expect(BLOG_CONTENT_BY_LOCALE.en).not.toBe(BLOG_CONTENT_BY_LOCALE.pl);
    expect(BLOG_CONTENT_BY_LOCALE.en.posts).not.toBe(
      BLOG_CONTENT_BY_LOCALE.pl.posts
    );
    expect(BLOG_CONTENT_BY_LOCALE.en.categories).not.toBe(
      BLOG_CONTENT_BY_LOCALE.pl.categories
    );
  });

  test('accepts only supported blog locales', () => {
    expect(isBlogLocale('en')).toBe(true);
    expect(isBlogLocale('pl')).toBe(true);
    expect(isBlogLocale('de')).toBe(false);
    expect(getBlogContent('en').pathPrefix).toBe('/en/blog');
  });
});
