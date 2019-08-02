import {ISimpleUserApi} from '../../models/simple-user-api.interface';
import {SimpleUser} from './simple-user';
import {userToSnakeCase} from '../utils/userToSnakeCase';
import {ISimpleProjectApi} from '../../models/simple-project-api.inferface';

export interface IUserApi {
    id: string;
    username: string;
    email: string;
    avatar: string;
    dateJoined: Date;
    facebookConnection: boolean;
    googleConnection: boolean;
    inboxPk: number;
    orderTasksDashboard: string;
    assignsTaskToMe: boolean;
    changesTaskFromSharedListThatIsAssignedToMe: boolean;
    changesTaskFromSharedListThatIAssignedToHimHer: boolean;
    completesTaskFromSharedList: boolean;
    dailySummaryHour: string;
    deletesListSharedWithMe: boolean;
    leavesSharedList: boolean;
    removesMeFromSharedList: boolean;
    sharesListWithMe: boolean;
    dialogTimeWhenTaskFinishedInProject: boolean;
    defaultTaskView: string;
    allTasksView: string;
    defaultTaskViewTodayView: string;
    defaultTaskViewOverdueView: string;
    defaultTaskViewFutureView: string;
    defaultTaskViewTagsView: string;
    overdueTasksSortBy: string;
    futureTasksSortBy: string;
    projectsFilterId: number;
    tagsFilterId: number;
    dataJoined: string;
    avatarUrl: string;
    shareWith: ISimpleProjectApi[];
}


export class User {
    id: string;
    username: string;
    email: string;
    assignsTaskToMe: boolean;
    dateJoined: Date;
    facebookConnection: boolean;
    googleConnection: boolean;
    inboxPk: number;
    orderTasksDashboard: string;
    changesTaskFromSharedListThatIsAssignedToMe: boolean;
    changesTaskFromSharedListThatIAssignedToHimHer: boolean;
    completesTaskFromSharedList: boolean;
    dailySummaryHour: Date;
    deletesListSharedWithMe: boolean;
    leavesSharedList: boolean;
    removesMeFromSharedList: boolean;
    sharesListWithMe: boolean;
    avatarUrl: string;
    dialogTimeWhenTaskFinishedInProject: boolean;
    allTasksView: string;
    defaultTaskView: string;
    defaultTaskViewTodayView: string;
    defaultTaskViewOverdueView: string;
    defaultTaskViewFutureView: string;
    defaultTaskViewTagsView: string;
    overdueTasksSortBy: string;
    futureTasksSortBy: string;
    projectsFilterId: number;
    tagsFilterId: number;

    constructor({
                    id = null, username, email, avatarUrl = '', dateJoined = new Date(), facebookConnection = null,
                    googleConnection = null, inboxPk = null, orderTasksDashboard  = '',
                    assignsTaskToMe  = true, changesTaskFromSharedListThatIsAssignedToMe = true,
                    changesTaskFromSharedListThatIAssignedToHimHer = true,
                    allTasksView = 'extended',
                    completesTaskFromSharedList = true, dailySummaryHour = '', deletesListSharedWithMe = true, leavesSharedList = true,
                    removesMeFromSharedList = true,
                    dialogTimeWhenTaskFinishedInProject = false, defaultTaskView = 'extended', sharesListWithMe = true,
                    defaultTaskViewTodayView = 'extended', defaultTaskViewOverdueView = 'extended',
                    defaultTaskViewFutureView = 'extended', defaultTaskViewTagsView = 'extended', overdueTasksSortBy = '',
                    futureTasksSortBy = '', projectsFilterId = 1, tagsFilterId = 1
                }: IUserApi) {

        this.id = id;
        this.username = username;
        this.email = email;
        this.dateJoined = new Date(dateJoined);
        this.facebookConnection = facebookConnection;
        this.googleConnection = googleConnection;
        this.inboxPk = inboxPk;
        this.orderTasksDashboard = orderTasksDashboard;
        this.avatarUrl = avatarUrl;
        // notifications
        this.assignsTaskToMe = assignsTaskToMe;
        this.changesTaskFromSharedListThatIsAssignedToMe = changesTaskFromSharedListThatIsAssignedToMe;
        this.changesTaskFromSharedListThatIAssignedToHimHer = changesTaskFromSharedListThatIAssignedToHimHer;
        this.completesTaskFromSharedList = completesTaskFromSharedList;
        this.dailySummaryHour = this.setDailySummaryHour(dailySummaryHour);
        this.deletesListSharedWithMe = deletesListSharedWithMe;
        this.leavesSharedList = leavesSharedList;
        this.removesMeFromSharedList = removesMeFromSharedList;
        this.sharesListWithMe = sharesListWithMe;
        // settings
        this.dialogTimeWhenTaskFinishedInProject = dialogTimeWhenTaskFinishedInProject;
        this.defaultTaskView = defaultTaskView;
        this.allTasksView = allTasksView;
        this.defaultTaskViewTodayView = defaultTaskViewTodayView;
        this.defaultTaskViewOverdueView = defaultTaskViewOverdueView;
        this.defaultTaskViewFutureView = defaultTaskViewFutureView;
        this.defaultTaskViewTagsView = defaultTaskViewTagsView;
        this.overdueTasksSortBy = overdueTasksSortBy;
        this.futureTasksSortBy = futureTasksSortBy;
        this.projectsFilterId = projectsFilterId;
        this.tagsFilterId = tagsFilterId;
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
