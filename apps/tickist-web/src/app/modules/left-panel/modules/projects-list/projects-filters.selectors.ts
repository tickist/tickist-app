import {createFeatureSelector, createSelector} from '@ngrx/store';
import * as _ from 'lodash';
import {ProjectsFiltersState} from './projects-filters.reducers';
import {selectAllProjects} from '../../../../core/selectors/projects.selectors';
import {Project} from '../../../../../../../../libs/data/src/lib/projects/models';
import {selectAllTasks, selectAllUndoneTasks} from '../../../../core/selectors/task.selectors';
import {ProjectLeftPanel} from './models/project-list';
import {calculateProjectsLevel, calculateTasksCounter, generateDifferentLevelsOfProjects} from '../../../../core/utils/projects-utils';


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
        // const listOfProjects = calculateTasksCounter(projects.filter(Function(`return ${filter.value}`)()), tasks);
        return calculateTasksCounter(
            generateDifferentLevelsOfProjects(
                projects
            ),
            tasks
        ).filter(Function(`return ${filter.value}`)());
    }
);
