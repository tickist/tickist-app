import {ActionReducerMap} from '@ngrx/store';
import {currentProjectsFilters, projectsFilters} from './reducers/projects';
import {currentTagsFilters, tagsFilters} from './reducers/tags';
import {currentTasksFilters, futureTasksFilters, currentTasksFutureFilters} from './reducers/tasks';
import {
    detectApiError, leftSidenavVisibility, rightSidenavVisibility, offlineModeNotification, addTaskComponentVisibility, activeDateElement
} from './reducers/configuration';
import {IActiveDateElement} from './models/active-data-element.interface';
import * as fromProgressBar from './reducers/progress-bar.reducer';

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
    dashboardActiveFutureElement: any;
    currentTasksFutureFilters: any;
    futureTasksFilters: any;
}

// const reducers = {projects, selectedProject, user, tasks, currentTasksFilters, tags,
//       tasksFilters, globalStatistics, dailyStatistics,activeDateElement, detectApiError, globalStatisticsDateRange, team,
//       chartsData, selectedProjectsIds, leftSidenavVisibility, rightSidenavVisibility, progressBar}


// const developmentReducer: ActionReducer<AppStore> = compose(storeFreeze, combineReducers)(reducers);
// const productionReducer: ActionReducer<AppStore> = combineReducers(reducers);

export const reducers: ActionReducerMap<any> = {
    currentTasksFilters: currentTasksFilters,
    activeDateElement: activeDateElement,
    detectApiError: detectApiError,
    offlineModeNotification: offlineModeNotification,
    addTaskComponentVisibility: addTaskComponentVisibility,
    leftSidenavVisibility: leftSidenavVisibility,
    rightSidenavVisibility: rightSidenavVisibility,
    currentProjectsFilters: currentProjectsFilters,
    projectsFilters: projectsFilters,
    currentTagsFilters: currentTagsFilters,
    tagsFilters: tagsFilters,
    currentTasksFutureFilters: currentTasksFutureFilters,
    futureTasksFilters: futureTasksFilters,
    progressBar: fromProgressBar.reducer
};


// export function authReducer(state: any, action: any) {
//   if (environment.production) {
//     return productionReducer(state, action);
//   } else {
//     return productionReducer(state, action);
//   }
// }
