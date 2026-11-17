import { describe, expect, test } from 'vitest';
import {
  PROJECT_ICON_CATEGORIES,
  PROJECT_ICON_OPTIONS,
  projectIconLabel,
  resolveProjectIconData,
  resolveProjectIconKey,
  searchProjectIcons,
} from './project-icons';

// Keys already stored in projects.icon; they must keep resolving.
const STORED_KEYS =
  'folder folder-open inbox calendar-days lightbulb flag target rocket shield star settings briefcase list-todo square-check square-pen clock heart plane shopping-cart users laptop brain graduation-cap dumbbell tree-pine car camera music gamepad-2 wallet badge-check bell sparkles house book repeat clipboard-list globe handshake building-2 alarm-clock trophy bug flask-conical stethoscope baby utensils-crossed palette pen-tool hammer wrench database server cloud leaf paw-print gift party-popper film headphones mic book-open notebook-pen receipt piggy-bank credit-card bus bike train-front map compass sun moon key-round lock landmark monitor smartphone telescope app-window paintbrush timer sandwich coffee podcast apple archive armchair atom award backpack banknote bath bed-double beer bird blocks bot box cake calculator chef-hat circle-dollar-sign circle-user-round clapperboard code-2 construction cpu crown dog droplets earth factory flower-2 footprints gem hand-heart hotel languages library mail medal mountain package phone pill pizza plug presentation puzzle radio recycle route school ship shopping-bag sprout store tent ticket tool-case truck tv umbrella university user-round video volleyball waves wifi wine'.split(
    ' '
  );

describe('project icon catalogue', () => {
  test('groups a large set of unique icons into categories', () => {
    const keys = PROJECT_ICON_OPTIONS.map((option) => option.key);

    expect(keys.length).toBeGreaterThan(400);
    expect(new Set(keys).size).toBe(keys.length);

    for (const category of PROJECT_ICON_CATEGORIES) {
      expect(category.icons.length).toBeGreaterThan(0);
    }
  });

  test('keeps every previously stored icon key', () => {
    const keys = new Set<string>(PROJECT_ICON_OPTIONS.map((o) => o.key));

    expect(STORED_KEYS.filter((key) => !keys.has(key))).toEqual([]);
  });

  test('resolves SVG data for every selectable key', () => {
    for (const option of PROJECT_ICON_OPTIONS) {
      expect(resolveProjectIconData(option.key)).toContain('<svg');
    }

    expect(resolveProjectIconKey('unknown-icon')).toBe('folder');
    expect(resolveProjectIconKey('toString')).toBe('folder');
    expect(projectIconLabel('paint-roller')).toBe('Painting');
  });

  test('searches labels, keywords and categories with every word', () => {
    const keys = (query: string) =>
      searchProjectIcons(query).map((option) => option.key);

    expect(keys('wedding')).toContain('calendar-heart');
    expect(keys('renovation')).toEqual(
      expect.arrayContaining(['paint-roller', 'bath', 'construction'])
    );
    expect(keys('  Home   renovation ')).toContain('paint-roller');
    expect(keys('zzz-nothing')).toEqual([]);
    expect(keys('')).toHaveLength(PROJECT_ICON_OPTIONS.length);
  });
});
