import {ActionReducer, ActionReducerMap, combineReducers} from '@ngrx/store';
import {compose} from '@ngrx/core';
import {storeFreeze} from 'ngrx-store-freeze';
import {projects, selectedProject, selectedProjectsIds, currentProjectsFilters, projectsFilters} from './reducers/projects';
import {team} from './reducers/team';
import {user} from './reducers/user';
import {tags} from './reducers/tags';
import {tasks, tasksFilters, currentTasksFilters} from './reducers/tasks';
import {globalStatistics, dailyStatistics, globalStatisticsDateRange, chartsData} from './reducers/statistics';
import {
    activeDay, detectApiError, leftSidenavVisibility, rightSidenavVisibility,
    progressBar, offlineModeNotification, addTaskComponentVisibility
} from './reducers/configuration';
import {environment} from '../environments/environment';


export interface AppStore {
    projects: any;
    selectedProject: any;
    user: any;
    tasks: any;
    currentTasksFilters: any;
    currentProjectsFilters: any;
    tags: any;
    tasksFilters: any;
    projectsFilters: any;
    globalStatistics: any;
    dailyStatistics: any;
    activeDay: any;
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
}

// const reducers = {projects, selectedProject, user, tasks, currentTasksFilters, tags,
//       tasksFilters, globalStatistics, dailyStatistics, activeDay, detectApiError, globalStatisticsDateRange, team,
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
    activeDay: activeDay,
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
    projectsFilters: projectsFilters
};


// export function reducer(state: any, action: any) {
//   if (environment.production) {
//     return productionReducer(state, action);
//   } else {
//     return productionReducer(state, action);
//   }
// }
