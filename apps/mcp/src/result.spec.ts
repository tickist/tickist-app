import { toolError, toolResult } from './result';
import { describe, expect, it } from 'vitest';

describe('tool results', () => {
  it('keeps object structured content and legacy text content', () => {
    expect(toolResult({ ok: true })).toMatchObject({
      structuredContent: { ok: true },
      content: [{ type: 'text', text: '{\n  "ok": true\n}' }],
    });
  });

  it('does not wrap arrays in structured content', () => {
    expect(toolResult([])).not.toHaveProperty('structuredContent');
  });

  it('returns safe tool errors', () => {
    expect(toolError(new Error('failed'))).toMatchObject({
      isError: true,
      content: [{ type: 'text', text: 'failed' }],
    });
  });
});
