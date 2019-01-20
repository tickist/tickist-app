import {createFeatureSelector, createSelector} from '@ngrx/store';
import {ActiveProjectsIdsState} from './active-projects-ids.reducer';
import {ActiveProjectState} from './active-project.reducer';
import * as fromCourse from '../projects/projects.reducer';
import {ProjectsState} from './projects.reducer';

export const selectActiveProjectsIdsState = createFeatureSelector<ActiveProjectsIdsState>('activeProjectsIds');
export const selectActiveProjectState = createFeatureSelector<ActiveProjectState>('activeProject');
export const selectProjectsState = createFeatureSelector<ProjectsState>('projects');

export const allProjectsLoaded = createSelector(
    selectProjectsState,
    tasksState => tasksState.allProjectsLoaded
);

export const selectProjectById = (projectId: number) => createSelector(
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
