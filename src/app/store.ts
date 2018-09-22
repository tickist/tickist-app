import {ActionReducerMap} from '@ngrx/store';
import {projects, selectedProject, selectedProjectsIds, currentProjectsFilters, projectsFilters} from './reducers/projects';
import {team} from './reducers/team';
import {user} from './reducers/user';
import {currentTagsFilters, tags, tagsFilters} from './reducers/tags';
import {tasks, tasksFilters, currentTasksFilters, futureTasksFilters, currentTasksFutureFilters} from './reducers/tasks';
import {globalStatistics, dailyStatistics, globalStatisticsDateRange, chartsData} from './reducers/statistics';
import {
    detectApiError, leftSidenavVisibility, rightSidenavVisibility,
    progressBar, offlineModeNotification, addTaskComponentVisibility, activeDateElement
} from './reducers/configuration';
import {IActiveDateElement} from './models/active-data-element.interface';

export interface AppStore {
    projects: any;
    selectedProject: any;
    user: any;
    tasks: any;
    currentTasksFilters: any;
    currentProjectsFilters: any;
    currentTagsFilters: any;
    tags: any;
    tasksFilters: any;
    projectsFilters: any;
    tagsFilters: any;
    globalStatistics: any;
    dailyStatistics: any;
    activeDateElement: IActiveDateElement;
    detectApiError: any;
    offlineModeNotification: any;
    addTaskComponentVisibility: any;
    globalStatisticsDateRage: any;
    team: any;
    chartsData: any;
    selectedProjectsIds: any;
    leftSidenavVisibility: any;
    rightSidenavVisibility: any;
    progressBar: boolean;
    dashboardActiveFutureElement: any;
    currentTasksFutureFilters: any;
    futureTasksFilters: any;
}

// const reducers = {projects, selectedProject, user, tasks, currentTasksFilters, tags,
//       tasksFilters, globalStatistics, dailyStatistics,activeDateElement, detectApiError, globalStatisticsDateRange, team,
//       chartsData, selectedProjectsIds, leftSidenavVisibility, rightSidenavVisibility, progressBar}


//const developmentReducer: ActionReducer<AppStore> = compose(storeFreeze, combineReducers)(reducers);
//const productionReducer: ActionReducer<AppStore> = combineReducers(reducers);

export const reducers: ActionReducerMap<any> = {
    projects: projects,
    selectedProject: selectedProject,
    user: user,
    tasks: tasks,
    currentTasksFilters: currentTasksFilters,
    tags: tags,
    tasksFilters: tasksFilters,
    globalStatistics: globalStatistics,
    dailyStatistics: dailyStatistics,
    activeDateElement: activeDateElement,
    detectApiError: detectApiError,
    offlineModeNotification: offlineModeNotification,
    addTaskComponentVisibility: addTaskComponentVisibility,
    globalStatisticsDateRange: globalStatisticsDateRange,
    team: team,
    chartsData: chartsData,
    selectedProjectsIds: selectedProjectsIds,
    leftSidenavVisibility: leftSidenavVisibility,
    rightSidenavVisibility: rightSidenavVisibility,
    progressBar: progressBar,
    currentProjectsFilters: currentProjectsFilters,
    projectsFilters: projectsFilters,
    currentTagsFilters: currentTagsFilters,
    tagsFilters: tagsFilters,
    currentTasksFutureFilters: currentTasksFutureFilters,
    futureTasksFilters: futureTasksFilters
};


// export function reducer(state: any, action: any) {
//   if (environment.production) {
//     return productionReducer(state, action);
//   } else {
//     return productionReducer(state, action);
//   }
// }
