import { describe, expect, test } from 'vitest';
import { Project } from '../../data/project-data.service';
import {
  buildProjectTaskScope,
  taskMatchesProjectScope,
} from './project-task-scope';

describe('project task scope', () => {
  const projects = [
    makeProject('parent', null),
    makeProject('child', 'parent'),
    makeProject('grandchild', 'child'),
    makeProject('unrelated', null),
  ];

  test('includes the selected project and every descendant', () => {
    const scope = buildProjectTaskScope(projects, 'parent', new Set());

    expect(scope).toEqual(new Set(['parent', 'child', 'grandchild']));
  });

  test('excludes each project independently without excluding its descendants', () => {
    const scope = buildProjectTaskScope(projects, 'parent', new Set(['child']));

    expect(scope).toEqual(new Set(['parent', 'grandchild']));
  });

  test('matches tasks only from projects remaining in the scope', () => {
    const scope = buildProjectTaskScope(projects, 'parent', new Set(['child']));

    expect(
      taskMatchesProjectScope({ projectId: 'parent' }, 'parent', null, scope)
    ).toBe(true);
    expect(
      taskMatchesProjectScope({ projectId: 'child' }, 'parent', null, scope)
    ).toBe(false);
    expect(
      taskMatchesProjectScope(
        { projectId: 'grandchild' },
        'parent',
        null,
        scope
      )
    ).toBe(true);
    expect(
      taskMatchesProjectScope({ projectId: 'unrelated' }, 'parent', null, scope)
    ).toBe(false);
  });

  test('keeps unassigned Inbox tasks in the Inbox scope', () => {
    const scope = buildProjectTaskScope(
      [makeProject('inbox', null, true)],
      'inbox',
      new Set()
    );

    expect(
      taskMatchesProjectScope({ projectId: null }, 'inbox', 'inbox', scope)
    ).toBe(true);
  });
});

function makeProject(
  id: string,
  ancestorId: string | null,
  isInbox = false
): Project {
  return {
    id,
    ownerId: 'owner',
    name: id,
    description: '',
    color: '#000000',
    icon: 'folder',
    isActive: true,
    isInbox,
    projectType: 'active',
    ancestorId,
    taskView: 'extended',
    shareWithIds: [],
    members: [],
  };
}
