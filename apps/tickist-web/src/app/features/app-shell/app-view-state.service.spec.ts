import { describe, expect, test } from 'vitest';
import { AppViewStateService } from './app-view-state.service';

describe('AppViewStateService project task visibility', () => {
  test('tracks independently excluded projects', () => {
    const service = new AppViewStateService();

    service.selectProject('parent');
    service.setProjectTasksIncluded('parent', false);
    service.setProjectTasksIncluded('child', false);

    expect([...service.excludedProjectIds()]).toEqual(['parent', 'child']);

    service.setProjectTasksIncluded('parent', true);

    expect([...service.excludedProjectIds()]).toEqual(['child']);
  });

  test('keeps visibility when selecting the same project', () => {
    const service = new AppViewStateService();

    service.selectProject('parent');
    service.setProjectTasksIncluded('child', false);
    service.selectProject('parent');

    expect(service.excludedProjectIds().has('child')).toBe(true);
  });

  test('resets visibility when selecting another project', () => {
    const service = new AppViewStateService();

    service.selectProject('parent');
    service.setProjectTasksIncluded('child', false);
    service.selectProject('other');

    expect(service.excludedProjectIds().size).toBe(0);
  });
});
