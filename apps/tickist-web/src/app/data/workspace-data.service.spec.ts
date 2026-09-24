import { describe, expect, it } from 'vitest';
import { effectiveWorkspaceId } from './workspace-data.service';

const project = {
  id: 'shared',
  ownerId: 'owner',
  isInbox: false,
  workspaceId: 'owner-work',
  ancestorId: null,
};

describe('workspace assignment', () => {
  it('keeps the owner assignment independent from a member override', () => {
    const overrides = new Map([['shared', 'member-work']]);
    expect(
      effectiveWorkspaceId(project, 'owner', overrides, 'owner-private')
    ).toBe('owner-work');
    expect(
      effectiveWorkspaceId(project, 'member', overrides, 'member-private')
    ).toBe('member-work');
  });

  it('puts newly shared projects in the recipient private workspace', () => {
    expect(
      effectiveWorkspaceId(project, 'member', new Map(), 'member-private')
    ).toBe('member-private');
  });

  it('keeps Inbox outside workspace assignments', () => {
    expect(
      effectiveWorkspaceId(
        { ...project, isInbox: true },
        'owner',
        new Map(),
        'private'
      )
    ).toBeNull();
  });

  it('inherits a recipient assignment for a newly shared subproject', () => {
    const child = { ...project, id: 'child', ancestorId: project.id };
    const overrides = new Map([['shared', 'member-work']]);
    expect(
      effectiveWorkspaceId(child, 'member', overrides, 'member-private', [
        project,
      ])
    ).toBe('member-work');
  });
});
