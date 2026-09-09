export type ProjectAccessLookup = (
  userId: string,
  projectId: string
) => Promise<boolean>;

export const canAccessProject = async (
  userId: string,
  projectId: string,
  isOwner: ProjectAccessLookup,
  isAcceptedMember: ProjectAccessLookup
): Promise<boolean> =>
  (await isOwner(userId, projectId)) ||
  (await isAcceptedMember(userId, projectId));
