import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as fromCourse from "../reducers/tasks/task.reducer";
import { TasksState } from "../reducers/tasks/task.reducer";
import {
    selectCurrentAssignedToFilter,
    selectCurrentEstimateTimeFilter,
    selectCurrentMainFilter,
    selectCurrentTagsFilter,
    selectSearchTasksText,
} from "./filters-tasks.selectors";
import { Task } from "@data/tasks/models/tasks";
import { Tag } from "@data/tags/models/tags";
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as _ from "lodash";
import { orderBy } from "lodash";

import { selectActiveProjects, selectActiveProjectsIds } from "./projects.selectors";
import { selectCurrentSortBy } from "./sort-by-tasks.selectors";
import { selectLoggedInUser } from "./user.selectors";
import { TaskType } from "@data";

export const selectTasksState = createFeatureSelector<TasksState>("task");

export const allTasksLoaded = createSelector(selectTasksState, (tasksState) => tasksState.allTasksLoaded);

export const selectTaskById = (taskId: number) => createSelector(selectTasksState, (tasksState) => tasksState.entities[taskId]);

export const selectAllTasks = createSelector(selectTasksState, fromCourse.selectAll);

export const selectInboxTasksCounter = createSelector(selectAllTasks, selectLoggedInUser, (tasks, user) => {
    console.log({ tasks });
    return tasks.filter((task) => task.taskProject.id === user.inboxPk).length;
});

export const selectAllUndoneTasks = createSelector(selectAllTasks, (tasks) => tasks.filter((task) => task.isDone === false));

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
            .filter(Function(`return ${estimateTimeFilter.currentFilterLt.value}`)())
            .filter(Function(`return ${estimateTimeFilter.currentFilterGt.value}`)());

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
        } else if (tagsFilter.value === "allTags") {
            tasks = tasks.filter((task) => !(task.tags.length === 0));
        } else if (tagsFilter.value === "withoutTags") {
            tasks = tasks.filter((task) => task.tags.length === 0);
        }
        if (searchFilter) {
            const re = new RegExp(searchFilter, "i");
            tasks = tasks.filter((task) => re.test(task.name));
        }
        tasks = orderBy(tasks, currentSortBy.sortKeys, currentSortBy.order);
        return tasks;
    },
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
        tasks = tasks
            .filter(Function(`return ${mainFilter.value}`)())
            .filter(Function(`return ${assignedToFilter.value}`)())
            .filter(Function(`return ${estimateTimeFilter.currentFilterLt.value}`)())
            .filter(Function(`return ${estimateTimeFilter.currentFilterGt.value}`)());
        if (activeProjectIds.length > 0) {
            tasks = tasks.filter((task) => activeProjectIds.indexOf(task.taskProject.id) > -1);
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
        } else if (tagsFilter.value === "allTags") {
            tasks = tasks.filter((task) => !(task.tags.length === 0));
        } else if (tagsFilter.value === "withoutTags") {
            tasks = tasks.filter((task) => task.tags.length === 0);
        }
        if (searchFilter) {
            const re = new RegExp(searchFilter.replace(/[^\w\s.&-]+/g, ""), "i");
            tasks = tasks.filter((task) => re.test(task.name.replace(/[^\w\s.&-]+/g, "")));
        }
        if (currentSortBy) {
            tasks = orderBy(tasks, currentSortBy.sortKeys, currentSortBy.order);
        }

        return tasks;
    },
);

export const nextActionTasks = createSelector(selectAllTasks, selectLoggedInUser, selectSearchTasksText, (tasks, user, searchFilter) => {
    if (searchFilter) {
        const re = new RegExp(searchFilter, "i");
        tasks = tasks.filter((task) => re.test(task.name));
    }
    return orderBy(
        tasks.filter((task) => task.owner.id === user.id).filter((task) => task.taskType === TaskType.nextAction),
        ["priority", (task) => _.deburr(task.name.toLowerCase())],
        ["asc", "asc"],
    );
});

export const needInfoTasks = createSelector(selectAllTasks, selectLoggedInUser, selectSearchTasksText, (tasks, user, searchFilter) => {
    if (searchFilter) {
        const re = new RegExp(searchFilter, "i");
        tasks = tasks.filter((task) => re.test(task.name));
    }
    return tasks.filter((task) => task.owner.id === user.id).filter((task) => task.taskType === TaskType.needInfo);
});

export const projectWithoutNextActionTasks = createSelector(
    selectAllTasks,
    selectActiveProjects,
    selectSearchTasksText,
    (tasks, projects, searchFilter) => {
        let projectsWithoutNextActionTasks = [];
        projects.forEach((project) => {
            if (!tasks.some((task) => task.taskType === TaskType.nextAction && task.taskProject.id === project.id)) {
                projectsWithoutNextActionTasks.push(project);
            }
        });
        if (searchFilter) {
            const re = new RegExp(searchFilter, "i");
            projectsWithoutNextActionTasks = projectsWithoutNextActionTasks.filter((task) => re.test(task.name));
        }
        return projectsWithoutNextActionTasks;
    },
);

export const nextActionTasksLength = createSelector(nextActionTasks, (tasks) => tasks.length);

export const needInfoTasksLength = createSelector(needInfoTasks, (tasks) => tasks.length);

export const projectWithoutNextActionTasksLength = createSelector(projectWithoutNextActionTasks, (projects) => projects.length);
