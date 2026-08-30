import { describe, expect, test } from 'vitest';
import {
  PROJECT_ICON_OPTIONS,
  resolveProjectIconData,
  resolveProjectIconKey,
} from './project-icons';

describe('project icon catalogue', () => {
  test('provides a large unique Lucide catalogue', () => {
    const keys = PROJECT_ICON_OPTIONS.map((option) => option.key);

    expect(keys.length).toBeGreaterThan(140);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain('pizza');
    expect(keys).toContain('presentation');
    expect(keys).toContain('volleyball');
  });

  test('resolves SVG data for every selectable key', () => {
    for (const option of PROJECT_ICON_OPTIONS) {
      expect(resolveProjectIconData(option.key)).toContain('<svg');
    }
    expect(resolveProjectIconKey('unknown-icon')).toBe('folder');
  });
});
