import {createFeatureSelector, createSelector} from '@ngrx/store';
import {ActiveProjectsIdsState} from '../reducers/active-projects-ids.reducer';
import {ActiveProjectState} from '../reducers/active-project.reducer';
import * as fromCourse from '../reducers/projects/projects.reducer';
import {ProjectsState} from '../reducers/projects/projects.reducer';

export const selectActiveProjectsIdsState = createFeatureSelector<ActiveProjectsIdsState>('activeProjectsIds');
export const selectActiveProjectState = createFeatureSelector<ActiveProjectState>('activeProject');
export const selectProjectsState = createFeatureSelector<ProjectsState>('projects');

export const allProjectsLoaded = createSelector(
    selectProjectsState,
    tasksState => tasksState.allProjectsLoaded
);

export const selectProjectById = (projectId: string) => createSelector(
    selectProjectsState,
    projectsState => projectsState.entities[projectId]
);

export const selectAllProjects = createSelector(
    selectProjectsState,
    fromCourse.selectAll
);

export const selectAllProjectsL0L1 = createSelector(
    selectAllProjects,
    (projects) => projects.filter(project => project.level < 2)
);

export const selectActiveProjectsIds = createSelector(
    selectActiveProjectsIdsState,
   activeProjectsIds => activeProjectsIds.projectsIds
);

export const selectActiveProject = createSelector(
    selectActiveProjectState,
    activeProject => activeProject.activeProject
);
