import {createFeatureSelector, createSelector} from '@ngrx/store';
import {ActiveProjectsIdsState} from '../reducers/active-projects-ids.reducer';
import {ActiveProjectState} from '../reducers/active-project.reducer';
import * as fromCourse from '../reducers/projects/projects.reducer';
import {ProjectsState} from '../reducers/projects/projects.reducer';
import {calculateProjectDescendants, generateDifferentLevelsOfProjects} from '../utils/projects-utils';
import {ProjectWithAllDescendants} from '../../models/projects/project-with-all-descendants';

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

// @TODO Fix it
// export const selectAllProjectsL0L1 = createSelector(
//     selectAllProjects,
//     (projects) => projects.filter(project => project.level < 2)
// );


export const selectAllProjectsWithLevelAndTreeStructures = createSelector(
    selectAllProjects,
    projects => {
        return generateDifferentLevelsOfProjects(projects);
    }
);

export const selectActiveProjectsIds = createSelector(
    selectActiveProjectsIdsState,
    activeProjectsIds => activeProjectsIds.projectsIds
);

export const selectActiveProject = createSelector(
    selectActiveProjectState,
    selectAllProjects,
    activeProject => activeProject.activeProject
);

export const selectActiveProjectWithAllDescendants = createSelector(
    selectActiveProject,
    selectAllProjects,
    (activeProject, projects): ProjectWithAllDescendants => {
        if (!activeProject) return Object.assign({}, activeProject, {allDescendants: []});
        const allDescendants = calculateProjectDescendants(activeProject, projects);
        return Object.assign({}, activeProject, {allDescendants});
    });
