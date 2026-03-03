import { Pipe, PipeTransform } from '@angular/core';

const URL_REGEX = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;
const TRAILING_PUNCTUATION = /[),.!?;:]+$/;

@Pipe({
  name: 'linkify',
  standalone: true,
})
export class LinkifyPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    URL_REGEX.lastIndex = 0;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    const output: string[] = [];

    while ((match = URL_REGEX.exec(value)) !== null) {
      const start = match.index;
      const rawMatch = match[0];
      const trailingMatch = rawMatch.match(TRAILING_PUNCTUATION);
      const trailing = trailingMatch?.[0] ?? '';
      const urlPart = trailing ? rawMatch.slice(0, -trailing.length) : rawMatch;

      output.push(escapeHtml(value.slice(lastIndex, start)));
      output.push(buildAnchor(urlPart));
      if (trailing) {
        output.push(escapeHtml(trailing));
      }

      lastIndex = start + rawMatch.length;
    }

    if (!output.length) {
      return escapeHtml(value);
    }

    output.push(escapeHtml(value.slice(lastIndex)));
    return output.join('');
  }
}

function buildAnchor(urlText: string): string {
  const href = urlText.startsWith('http') ? urlText : `https://${urlText}`;
  const safeHref = escapeHtml(href);
  const safeText = escapeHtml(urlText);

  return (
    `<a class="link link-primary" href="${safeHref}" target="_blank" rel="noopener noreferrer">` +
    `${safeText}</a>`
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
