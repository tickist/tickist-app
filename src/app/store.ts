import {ActionReducerMap} from '@ngrx/store';
import {leftSidenavVisibility, rightSidenavVisibility, addTaskComponentVisibility
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
    addTaskComponentVisibility: addTaskComponentVisibility,
    leftSidenavVisibility: leftSidenavVisibility,
    rightSidenavVisibility: rightSidenavVisibility
};


// export function authReducer(state: any, action: any) {
//   if (environment.production) {
//     return productionReducer(state, action);
//   } else {
//     return productionReducer(state, action);
//   }
// }
