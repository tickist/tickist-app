import {createFeatureSelector, createSelector} from '@ngrx/store';
import * as fromCourse from '../reducers/tasks/task.reducer';
import {TasksState} from '../reducers/tasks/task.reducer';
import {
    selectCurrentAssignedToFilter,
    selectCurrentEstimateTimeFilter,
    selectCurrentMainFilter,
    selectCurrentTagsFilter,
    selectSearchTasksText
} from './filters-tasks.selectors';
import {Task} from '@data/tasks/models/tasks';
import {Tag} from '@data/tags/models/tags';
import {orderBy} from 'lodash';

import {selectActiveProjectsIds, selectAliveProjects} from './projects.selectors';
import {selectCurrentSortBy} from './sort-by-tasks.selectors';
import {selectLoggedInUser} from './user.selectors';
import {Project, TaskType} from "@data";
import * as _ from "lodash";


export const selectTasksState = createFeatureSelector<TasksState>('task');

export const allTasksLoaded = createSelector(
    selectTasksState,
    tasksState => tasksState.allTasksLoaded
);

export const selectTaskById = (taskId: number) => createSelector(
    selectTasksState,
    tasksState => tasksState.entities[taskId]
);

export const selectAllTasks = createSelector(
    selectTasksState,
    fromCourse.selectAll
);

export const selectInboxTasksCounter = createSelector(
    selectAllTasks,
    selectLoggedInUser,
    (tasks, user) => {
        return tasks.filter(task => task.taskProject.id === user.inboxPk).length
    }
)

export const selectAllUndoneTasks = createSelector(
    selectAllTasks,
    tasks => {
        return tasks.filter(task => task.isDone === false);
    }
);

export const selectTasksStreamInTagsView = createSelector(
    selectAllTasks,
    selectCurrentTagsFilter,
    selectCurrentAssignedToFilter,
    selectCurrentMainFilter,
    selectSearchTasksText,
    selectCurrentEstimateTimeFilter,
    selectCurrentSortBy,
    selectLoggedInUser,
    (tasks, tagsFilter, assignedToFilter, mainFilter, searchFilter, estimateTimeFilter, currentSortBy, user) => {
        if (!user || tasks.length === 0) return [];
        tasks = tasks
            .filter(Function(`return ${mainFilter.value}`)())
            .filter(Function(`return ${assignedToFilter.value}`)())
            .filter(Function(`return ${estimateTimeFilter.currentFilter_lt.value}`)())
            .filter(Function(`return ${estimateTimeFilter.currentFilter_gt.value}`)());

        if (tagsFilter.value instanceof Array) {
            const tags = new Set(tagsFilter.value);
            tasks = tasks.filter((task: Task) => {
                const result = [];
                task.tags.forEach((tag: Tag) => {
                    if (tags.has(tag.id)) {
                        result.push(tag.id);
                    }
                });
                return result.length === tags.size;
            });
        } else if (tagsFilter.value === 'allTags') {
            tasks = tasks.filter((task) => {
                return !(task.tags.length === 0);
            });
        } else if (tagsFilter.value === 'withoutTags') {
            tasks = tasks.filter((task) => {
                return (task.tags.length === 0);
            });
        }
        if (searchFilter) {
            const re = new RegExp(searchFilter, 'i');
            tasks = tasks.filter((task) => re.test(task.name));
        }
        tasks = orderBy(tasks, currentSortBy.sortKeys, currentSortBy.order);
        return tasks;
    }
);

export const selectTasksStreamInProjectsView = createSelector(
    selectAllTasks,
    selectCurrentTagsFilter,
    selectCurrentAssignedToFilter,
    selectCurrentMainFilter,
    selectSearchTasksText,
    selectCurrentEstimateTimeFilter,
    selectActiveProjectsIds,
    selectCurrentSortBy,
    (tasks, tagsFilter, assignedToFilter, mainFilter, searchFilter, estimateTimeFilter, activeProjectIds, currentSortBy) => {
        console.log({activeProjectIds})
        tasks = tasks
            .filter(Function(`return ${mainFilter.value}`)())
            .filter(Function(`return ${assignedToFilter.value}`)())
            .filter(Function(`return ${estimateTimeFilter.currentFilter_lt.value}`)())
            .filter(Function(`return ${estimateTimeFilter.currentFilter_gt.value}`)());
        if (activeProjectIds.length > 0) {
            tasks = tasks.filter((task => activeProjectIds.indexOf(task.taskProject.id) > -1));
        }
        if (tagsFilter.value instanceof Array) {
            const tags = new Set(tagsFilter.value);
            tasks = tasks.filter((task: Task) => {
                const result = [];
                task.tags.forEach((tag: Tag) => {
                    if (tags.has(tag.id)) {
                        result.push(tag.id);
                    }
                });
                return result.length === tags.size;
            });
        } else if (tagsFilter.value === 'allTags') {
            tasks = tasks.filter((task) => {
                return !(task.tags.length === 0);
            });
        } else if (tagsFilter.value === 'withoutTags') {
            tasks = tasks.filter((task) => {
                return (task.tags.length === 0);
            });
        }
        if (searchFilter) {
            const re = new RegExp(searchFilter, 'i');
            tasks = tasks.filter((task) => re.test(task.name));
        }
        if (currentSortBy) {
            tasks = orderBy(tasks, currentSortBy.sortKeys, currentSortBy.order);
        }

        return tasks;
    }
);

export const nextActionTasks = createSelector(
    selectAllTasks,
    selectLoggedInUser,
    (tasks, user) => {
        return orderBy(tasks
            .filter(task => task.owner.id === user.id)
            .filter(task => task.taskType === TaskType.NEXT_ACTION),
            ['priority', task => _.deburr(task.name.toLowerCase())],
            ['asc', 'asc']
            )
    }
)

export const needInfoTasks = createSelector(
    selectAllTasks,
    selectLoggedInUser,
    (tasks, user) => {
        return tasks
            .filter(task => task.owner.id === user.id)
            .filter(task => task.taskType === TaskType.NEED_INFO)
    }
)

export const projectWithoutNextActionTasks = createSelector(
    selectAllTasks,
    selectAliveProjects,
    (tasks, projects) => {
        const projectsWithoutNextActionTasks = []
        projects.forEach(project => {
            if (!tasks.some(task => task.taskType === TaskType.NEXT_ACTION && task.taskProject.id === project.id)) {
                projectsWithoutNextActionTasks.push(project)
            }
        })
        return projectsWithoutNextActionTasks
    }
)

export const nextActionTasksLength = createSelector(
    nextActionTasks,
    (tasks) => {
        return tasks.length;
    }
)

export const needInfoTasksLength = createSelector(
    needInfoTasks,
    (tasks) => {
        return tasks.length;
    }
)

export const projectWithoutNextActionTasksLength = createSelector(
    projectWithoutNextActionTasks,
    (projects) => {
        return projects.length;
    }
)
