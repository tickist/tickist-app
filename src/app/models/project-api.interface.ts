import {ISimpleUserApi} from './simple-user-api.interface';
import {ITagApi} from './tag-api.interface';

export interface IProjectApi {
    name: string;
    id?: number;
    ancestor;
    creation_date?: string;
    color: string;
    tasks_counter?: number;
    get_all_descendants?;
    description: string;
    default_task_view: string;
    default_finish_date;
    default_priority;
    default_type_finish_date;
    owner;
    lists?: any;
    level?: number;
    logo?: string;
    modification_date?: string;
    tags: ITagApi[];
    is_active: boolean;
    task_view?: string;
    dialog_time_when_task_finished: boolean;
    is_inbox: boolean;
    task_finish_date?: string | undefined;
    share_with: ISimpleUserApi[];
}
