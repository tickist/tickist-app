import {createFeatureSelector, createSelector} from '@ngrx/store';
import * as _ from 'lodash';
import {selectAllTasks, selectAllUndoneTasks} from '../../core/selectors/task.selectors';
import {FutureTasksFiltersState} from './future-tasks-filters.reducers';
import {selectLoggedInUser} from '../../core/selectors/user.selectors';
import {selectActiveDate} from '../../core/selectors/active-date.selectors';
import {Task} from '../../../../../../libs/data/src/lib/tasks/models/tasks';


export const selectFutureTasksFilters = createFeatureSelector<FutureTasksFiltersState>('futureTasks');

export const selectCurrentFutureTasksFilter = createSelector(
    selectFutureTasksFilters,
    projectsFilters => projectsFilters.currentFilter
);

export const selectAllFutureTasksFilters = createSelector(
    selectFutureTasksFilters,
    projectsFilters => projectsFilters.filters
);

export const selectFutureTasksList = createSelector(
    selectAllUndoneTasks,
    selectLoggedInUser,
    selectCurrentFutureTasksFilter,
    selectActiveDate,
    (tasks, user, filter, activeDate) => {
        if (!filter || !user) return [];
        const filteredTasks = tasks.filter(Function(`return ${filter.value}`)())
            .filter((task: Task) => {
                return task.owner.id === user.id
                    && task.isDone === false
                    && task.finishDate
                    && task.finishDate.month() === activeDate.date.month()
                    && task.finishDate.year() === activeDate.date.year();
            });

        const futureTasksSortBy = JSON.parse(user.futureTasksSortBy);
        return _.orderBy(filteredTasks, futureTasksSortBy.fields, futureTasksSortBy.orders);
    }
);
