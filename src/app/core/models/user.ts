import {ISimpleUserApi} from '../../models/simple-user-api.interface';
import {SimpleUser} from './simple-user';
import {userToSnakeCase} from '../utils/userToSnakeCase';
import {ISimpleProjectApi} from '../../models/simple-project-api.inferface';
import {
    DEFAULT_FUTURE_TASKS_SORT_BY,
    DEFAULT_OVERDUE_TASKS_SORT_BY,
    DEFAULT_PROJECTS_FILTER_ID,
    DEFAULT_TAGS_FILTER_ID, DEFAULT_TASKS_ORDER_OPTIONS
} from '../config/config-user';

export interface IUser {
    id: string;
    username: string;
    email: string;
    avatar: string;
    dateJoined: Date;
    facebookConnection?: boolean;
    googleConnection?: boolean;
    inboxPk: number;
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
    shareWith: ISimpleProjectApi[];
}


export class User {
    id: string;
    username: string;
    email: string;
    assignsTaskToMe = true;
    dateJoined: Date;
    facebookConnection = null;
    googleConnection = null;
    inboxPk: number;
    orderTasksDashboard = DEFAULT_TASKS_ORDER_OPTIONS;
    changesTaskFromSharedListThatIsAssignedToMe = true;
    changesTaskFromSharedListThatIAssignedToHimHer = true;
    completesTaskFromSharedList = true;
    dailySummaryHour: Date;
    deletesListSharedWithMe = true;
    leavesSharedList = true;
    removesMeFromSharedList = true;
    sharesListWithMe: boolean;
    avatarUrl = '';
    dialogTimeWhenTaskFinishedInProject = false;
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

    constructor(user: IUser) {
        Object.assign(this, user);

    //
    // constructor({
    //                 id = null, username, email, dateJoined = new Date(), facebookConnection = null,
    //                 googleConnection = null, inboxPk = null, orderTasksDashboard  = '',
    //                 assignsTaskToMe  = true, changesTaskFromSharedListThatIsAssignedToMe = true,
    //                 changesTaskFromSharedListThatIAssignedToHimHer = true,
    //                 allTasksView = 'extended',
    //                 completesTaskFromSharedList = true, dailySummaryHour = '', deletesListSharedWithMe = true, leavesSharedList = true,
    //                 removesMeFromSharedList = true,
    //                 dialogTimeWhenTaskFinishedInProject = false, defaultTaskView = 'extended', sharesListWithMe = true,
    //                 defaultTaskViewTodayView = 'extended', defaultTaskViewOverdueView = 'extended',
    //                 defaultTaskViewFutureView = 'extended', defaultTaskViewTagsView = 'extended', overdueTasksSortBy = '',
    //                 futureTasksSortBy = '', projectsFilterId = 1, tagsFilterId = 1
    //             }: IUserApi)


        this.id = user.id;
        this.dateJoined = new Date(user.dateJoined);
        this.inboxPk = user.inboxPk;
        this.orderTasksDashboard = user.orderTasksDashboard;
        // notifications
        this.assignsTaskToMe = user.assignsTaskToMe;
        this.changesTaskFromSharedListThatIsAssignedToMe = user.changesTaskFromSharedListThatIsAssignedToMe;
        this.changesTaskFromSharedListThatIAssignedToHimHer = user.changesTaskFromSharedListThatIAssignedToHimHer;
        this.dailySummaryHour = this.setDailySummaryHour(user.dailySummaryHour);

    }

    setDailySummaryHour(dailySummaryHour: string) {
        if (dailySummaryHour) {
            const date = new Date();
            date.setHours(parseInt(dailySummaryHour.split(':')[0], 10), parseInt(dailySummaryHour.split(':')[1], 10),
                parseInt(dailySummaryHour.split(':')[2], 10));
            return date;
        } else {
            return null;
        }

    }

    updateProjectsFilterId(filter) {
        this.projectsFilterId = filter.id;
    }

    updateTagsFilterId(filter) {
        this.tagsFilterId = filter.id;
    }

    convertToSimpleUser(): SimpleUser {
        const userApi = userToSnakeCase(this);
        const simpleUserApi: any = {
            avatar: userApi.avatar,
            avatar_url: userApi.avatar_url,
            email: userApi.email,
            id: userApi.id,
            username: userApi.username,
            shareWith: userApi.shareWith
        };
        return new SimpleUser(simpleUserApi);
    }
}
