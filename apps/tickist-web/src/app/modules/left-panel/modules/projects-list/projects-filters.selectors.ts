import {createFeatureSelector, createSelector} from '@ngrx/store';
import {ProjectsFiltersState} from './projects-filters.reducers';
import {selectAllProjects} from '../../../../core/selectors/projects.selectors';
import {selectAllUndoneTasks} from '../../../../core/selectors/task.selectors';
import {calculateTasksCounter, generateDifferentLevelsOfProjects} from '../../../../core/utils/projects-utils';
import {ProjectLeftPanel} from './models/project-list';
import {ProjectType} from "@data";


export const selectProjectsFilters = createFeatureSelector<ProjectsFiltersState>('projectsFilters');

export const selectCurrentProjectFilter = createSelector(
    selectProjectsFilters,
    projectsFilters => projectsFilters.currentFilter
);

export const selectAllProjectsFilters = createSelector(
    selectProjectsFilters,
    projectsFilters => projectsFilters.filters
);

export const selectAllProjectLeftPanel = createSelector(
    selectAllProjects,
    selectAllUndoneTasks,
    (projects, tasks): ProjectLeftPanel[] => {
        return calculateTasksCounter(
            generateDifferentLevelsOfProjects(
                projects
            ),
            tasks
        )
    }
 )

export const selectFilteredProjectsList = (projectType: ProjectType) => createSelector(
    selectAllProjects,
    selectCurrentProjectFilter,
    selectAllUndoneTasks,
    (projects, filter, tasks): ProjectLeftPanel[] => {
        if (!filter) return [];

        return calculateTasksCounter(
            generateDifferentLevelsOfProjects(
                projects.filter(project => project.projectType === projectType)
            ),
            tasks
        ).filter(Function(`return ${filter.value}`)());
    }
);
