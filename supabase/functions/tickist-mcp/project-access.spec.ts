import { describe, expect, it, vi } from 'vitest';
import { canAccessProject } from './project-access';

describe('MCP project access', () => {
  it('allows the project owner without a membership lookup', async () => {
    const isOwner = vi.fn(async () => true);
    const isAcceptedMember = vi.fn(async () => false);

    await expect(
      canAccessProject('user-1', 'project-1', isOwner, isAcceptedMember)
    ).resolves.toBe(true);
    expect(isAcceptedMember).not.toHaveBeenCalled();
  });

  it('allows an accepted member and rejects an unrelated user', async () => {
    const isOwner = vi.fn(async () => false);
    const isAcceptedMember = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await expect(
      canAccessProject('member-1', 'project-1', isOwner, isAcceptedMember)
    ).resolves.toBe(true);
    await expect(
      canAccessProject('stranger-1', 'project-1', isOwner, isAcceptedMember)
    ).resolves.toBe(false);
  });
});
