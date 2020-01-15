import {createFeatureSelector, createSelector} from '@ngrx/store';
import {ProjectsFiltersState} from './projects-filters.reducers';
import {selectAllProjects} from '../../../../core/selectors/projects.selectors';
import {selectAllUndoneTasks} from '../../../../core/selectors/task.selectors';
import {calculateTasksCounter, generateDifferentLevelsOfProjects} from '../../../../core/utils/projects-utils';


export const selectProjectsFilters = createFeatureSelector<ProjectsFiltersState>('projectsFilters');

export const selectCurrentProjectFilter = createSelector(
    selectProjectsFilters,
    projectsFilters => projectsFilters.currentFilter
);

export const selectAllProjectsFilters = createSelector(
    selectProjectsFilters,
    projectsFilters => projectsFilters.filters
);


export const selectFilteredProjectsList = createSelector(
    selectAllProjects,
    selectCurrentProjectFilter,
    selectAllUndoneTasks,
    (projects, filter, tasks) => {
        if (!filter) return [];

        return calculateTasksCounter(
            generateDifferentLevelsOfProjects(
                projects
            ),
            tasks
        ).filter(Function(`return ${filter.value}`)());
    }
);
