import { createFeatureSelector, createSelector } from "@ngrx/store";
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as _ from "lodash";
import { selectAllUndoneTasks } from "../../../../core/selectors/task.selectors";
import { FutureTasksFiltersState } from "../reducers/future-tasks-filters.reducers";
import { selectLoggedInUser } from "../../../../core/selectors/user.selectors";
import { selectActiveDate } from "../../../../core/selectors/active-date.selectors";
import { Task } from "@data/tasks/models/tasks";
import { getMonth, getYear } from "date-fns";

export const selectFutureTasksFilters = createFeatureSelector<FutureTasksFiltersState>("futureTasks");

export const selectCurrentFutureTasksFilter = createSelector(selectFutureTasksFilters, (projectsFilters) => projectsFilters.currentFilter);

export const selectAllFutureTasksFilters = createSelector(selectFutureTasksFilters, (projectsFilters) => projectsFilters.filters);

export const selectFutureTasksList = createSelector(
    selectAllUndoneTasks,
    selectLoggedInUser,
    selectCurrentFutureTasksFilter,
    selectActiveDate,
    (tasks, user, filter, activeDate) => {
        if (!filter || !user) return [];
        const filteredTasks = tasks
            .filter(Function(`return ${filter.value}`)())
            .filter(
                (task: Task) =>
                    task.owner.id === user.id &&
                    task.isDone === false &&
                    task.finishDate &&
                    getMonth(task.finishDate) === getMonth(activeDate.date) &&
                    getYear(task.finishDate) === getYear(activeDate.date)
            );

        const futureTasksSortBy = JSON.parse(user.futureTasksSortBy);
        return _.orderBy(filteredTasks, futureTasksSortBy.fields, futureTasksSortBy.orders);
    }
);
