import {
  buildHierarchy,
  collectDescendantIds,
} from '../../core/projects/project-tree';
import { Project } from '../../data/project-data.service';
import { Task } from '../../data/task-data.service';

export function buildProjectTaskScope(
  projects: ReadonlyArray<Project>,
  selectedProjectId: string | null,
  excludedProjectIds: ReadonlySet<string>
): ReadonlySet<string> | null {
  if (!selectedProjectId) {
    return null;
  }

  const hierarchy = buildHierarchy(projects);
  const projectIds = collectDescendantIds(hierarchy, selectedProjectId);
  projectIds.add(selectedProjectId);
  excludedProjectIds.forEach((projectId) => projectIds.delete(projectId));
  return projectIds;
}

export function taskMatchesProjectScope(
  task: Pick<Task, 'projectId'>,
  selectedProjectId: string | null,
  inboxProjectId: string | null,
  includedProjectIds: ReadonlySet<string> | null
): boolean {
  if (!selectedProjectId || !includedProjectIds) {
    return true;
  }

  if (!task.projectId && selectedProjectId === inboxProjectId) {
    return includedProjectIds.has(inboxProjectId);
  }

  return task.projectId ? includedProjectIds.has(task.projectId) : false;
}
