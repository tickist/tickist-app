import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { BlogSeoService } from './blog-seo.service';

describe('BlogSeoService', () => {
  test('writes canonical, feed, article metadata, and safe JSON-LD', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(BlogSeoService);
    const document = TestBed.inject(DOCUMENT);

    service.apply({
      title: 'Article | Tickist',
      description: 'A complete article description.',
      path: '/en/blog/article',
      locale: 'en',
      type: 'article',
      publishedAt: '2026-07-24T00:00:00Z',
      tags: ['planning'],
      jsonLd: [{ headline: '</script><script>alert(1)</script>' }],
    });

    expect(document.title).toBe('Article | Tickist');
    expect(
      document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
        ?.href
    ).toBe('https://tickist.com/en/blog/article');
    expect(
      document.head.querySelector<HTMLLinkElement>(
        'link[data-blog-feed="true"]'
      )?.href
    ).toBe('http://localhost:3000/en/blog/feed.xml');
    expect(
      document.head
        .querySelector('meta[property="article:tag"]')
        ?.getAttribute('content')
    ).toBe('planning');
    expect(
      document.head.querySelector('script[data-blog-json-ld="true"]')
        ?.textContent
    ).toContain('\\u003c/script>');
  });
});
