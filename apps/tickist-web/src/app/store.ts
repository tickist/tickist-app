import {ActionReducerMap, MetaReducer} from '@ngrx/store';
import {environment} from '../environments/environment';
import createNgrxMiddleware from 'logrocket-ngrx';
import LogRocket from 'logrocket';
import {IActiveDateElement} from '@data/active-data-element.interface';


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

// export const reducers: ActionReducerMap<any> = {
//     addTaskComponentVisibility: addTaskComponentVisibility,
//     leftSidenavVisibility: leftSidenavVisibility
// };



const logrocketMiddleware = createNgrxMiddleware(LogRocket, {});


export const metaReducers: MetaReducer<AppStore>[] =
    !environment.production ? [] : [logrocketMiddleware];
