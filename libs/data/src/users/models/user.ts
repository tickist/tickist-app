import {
    DEFAULT_DAILY_SUMMARY_HOUR,
    DEFAULT_DIALOG_TIME_WHEN_TASK_FINISHED_IN_PROJECT,
    DEFAULT_FUTURE_TASKS_SORT_BY,
    DEFAULT_OVERDUE_TASKS_SORT_BY,
    DEFAULT_PROJECTS_FILTER_ID,
    DEFAULT_TAGS_FILTER_ID,
    DEFAULT_TASKS_ORDER_OPTIONS,
    DEFAULT_USER_AVATAR
} from '../config-user';

export interface IUser {
    id: string;
    username: string;
    email: string;
    avatar: string;
    dateJoined: Date;
    isFacebookConnection?: boolean;
    isGoogleConnection?: boolean;
    inboxPk: string;
    orderTasksDashboard?: string;
    assignsTaskToMe?: boolean;
    changesTaskFromSharedListThatIsAssignedToMe?: boolean;
    changesTaskFromSharedListThatIAssignedToHimHer?: boolean;
    completesTaskFromSharedList?: boolean;
    dailySummaryHour: string;
    deletesListSharedWithMe?: boolean;
    leavesSharedList?: boolean;
    removesMeFromSharedList?: boolean;
    sharesListWithMe: boolean;
    dialogTimeWhenTaskFinishedInProject?: boolean;
    defaultTaskView?: string;
    allTasksView?: string;
    defaultTaskViewTodayView?: string;
    defaultTaskViewOverdueView?: string;
    defaultTaskViewFutureView?: string;
    defaultTaskViewTagsView?: string;
    overdueTasksSortBy?: string;
    futureTasksSortBy?: string;
    projectsFilterId?: number;
    tagsFilterId?: number;
    dataJoined: string;
    avatarUrl?: string;
    fcmToken?: string;
    flags: {};

    // shareWith: ISimpleProjectApi[];
}


export class User {
    id: string;
    username: string;
    email: string;
    assignsTaskToMe = true;
    readonly dateJoined: Date;
    isGoogleConnection = false;
    isFacebookConnection = false;
    inboxPk: string;
    orderTasksDashboard = DEFAULT_TASKS_ORDER_OPTIONS;
    changesTaskFromSharedListThatIsAssignedToMe = true;
    changesTaskFromSharedListThatIAssignedToHimHer = true;
    completesTaskFromSharedList = true;
    dailySummaryHour = DEFAULT_DAILY_SUMMARY_HOUR;
    deletesListSharedWithMe = true;
    leavesSharedList = true;
    removesMeFromSharedList = true;
    sharesListWithMe: boolean;
    avatarUrl = DEFAULT_USER_AVATAR;
    dialogTimeWhenTaskFinishedInProject = DEFAULT_DIALOG_TIME_WHEN_TASK_FINISHED_IN_PROJECT;
    allTasksView = 'extended';
    defaultTaskView = 'extended';
    defaultTaskViewTodayView = 'extended';
    defaultTaskViewOverdueView = 'extended';
    defaultTaskViewFutureView = 'extended';
    defaultTaskViewTagsView = 'extended';
    overdueTasksSortBy =  DEFAULT_OVERDUE_TASKS_SORT_BY;
    futureTasksSortBy = DEFAULT_FUTURE_TASKS_SORT_BY;
    projectsFilterId = DEFAULT_PROJECTS_FILTER_ID;
    tagsFilterId = DEFAULT_TAGS_FILTER_ID;
    fcmToken = '';
    flags = {};

    constructor(user: IUser) {
        Object.assign(this, user);
        if (!this.avatarUrl) this.avatarUrl = DEFAULT_USER_AVATAR;
    }
}
