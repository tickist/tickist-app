import {Api} from '../../models/commons';
import {IUserApi} from '../../models/user-api.interface';
import {ISimpleUserApi} from '../../models/simple-user-api.interface';
import {SimpleUser} from './simple-user';


export class User extends Api {
    id: number;
    username: string;
    email: string;
    assignsTaskToMe: boolean;
    avatar: string;
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

    constructor(user: IUserApi) {
        super();
        this.id = user.id || undefined;
        this.username = user.username;
        this.email = user.email;
        this.avatar = user.avatar;
        this.dateJoined = new Date(user.date_joined);
        this.facebookConnection = user.facebook_connection;
        this.googleConnection = user.google_connection;
        this.inboxPk = user.inbox_pk;
        this.orderTasksDashboard = user.order_tasks_dashboard;
        this.avatarUrl = user.avatar_url;
        // notifications
        this.assignsTaskToMe = user.assigns_task_to_me;
        this.changesTaskFromSharedListThatIsAssignedToMe = user.changes_task_from_shared_list_that_is_assigned_to_me;
        this.changesTaskFromSharedListThatIAssignedToHimHer = user.changes_task_from_shared_list_that_i_assigned_to_him_her;
        this.completesTaskFromSharedList = user.completes_task_from_shared_list;
        this.dailySummaryHour = this.setDailySummaryHour(user.daily_summary_hour);
        this.deletesListSharedWithMe = user.deletes_list_shared_with_me;
        this.leavesSharedList = user.leaves_shared_list;
        this.removesMeFromSharedList = user.removes_me_from_shared_list;
        this.sharesListWithMe = user.shares_list_with_me;
        // settings
        this.dialogTimeWhenTaskFinishedInProject = user.dialog_time_when_task_finished_in_project;
        this.defaultTaskView = user.default_task_view;
        this.allTasksView = user.all_tasks_view;
        this.defaultTaskViewTodayView = user.default_task_view_today_view;
        this.defaultTaskViewOverdueView = user.default_task_view_overdue_view;
        this.defaultTaskViewFutureView = user.default_task_view_future_view;
        this.defaultTaskViewTagsView = user.default_task_view_tags_view;
        this.overdueTasksSortBy = user.overdue_tasks_sort_by;
        this.futureTasksSortBy = user.future_tasks_sort_by;
        this.projectsFilterId = user.projects_filter_id;
        this.tagsFilterId = user.tags_filter_id;
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

    toApi(): IUserApi {
        const result: IUserApi = (<IUserApi>super.toApi());
        if (this.dailySummaryHour) {
            const hour = this.dailySummaryHour.getHours();
            const minute = this.dailySummaryHour.getMinutes();
            const second = this.dailySummaryHour.getSeconds();
            const hourFormatted = hour < 10 ? '0' + hour : hour;
            const minuteFormatted = minute < 10 ? '0' + minute : minute;
            const secondFormatted = second < 10 ? '0' + second : second;
            result['daily_summary_hour'] = `${hourFormatted}:${minuteFormatted}:${secondFormatted}`;
        }

        return result;
    }

    convertToSimpleUser(): SimpleUser {
        const userApi = this.toApi();
        const simpleUserApi: ISimpleUserApi = {
            avatar: userApi.avatar,
            avatar_url: userApi.avatar_url,
            email: userApi.email,
            id: userApi.id,
            username: userApi.username,
            share_with: userApi.share_with
        };
        return new SimpleUser(simpleUserApi);
    }
}
