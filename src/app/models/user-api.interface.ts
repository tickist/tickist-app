import {ISimpleProjectApi} from './simple-project-api.inferface';

export interface IUserApi {
    id: number;
    username: string;
    email: string;
    avatar: string;
    date_joined: string;
    facebook_connection: boolean;
    google_connection: boolean;
    inbox_pk: number;
    order_tasks_dashboard: string;
    avatar_url: string;
    assigns_task_to_me: boolean;
    changes_task_from_shared_list_that_is_assigned_to_me: boolean;
    changes_task_from_shared_list_that_i_assigned_to_him_her: boolean;
    completes_task_from_shared_list: boolean;
    daily_summary_hour: string;
    deletes_list_shared_with_me: boolean;
    leaves_shared_list: boolean;
    removes_me_from_shared_list: boolean;
    shares_list_with_me: boolean;
    dialog_time_when_task_finished_in_project: boolean;
    default_task_view: string;
    all_tasks_view: string;
    default_task_view_today_view: string;
    default_task_view_overdue_view: string;
    default_task_view_future_view: string;
    default_task_view_tags_view: string;
    overdue_tasks_sort_by: string;
    future_tasks_sort_by: string;
    projects_filter_id: number;
    tags_filter_id: number;
    share_with: ISimpleProjectApi[];
}
