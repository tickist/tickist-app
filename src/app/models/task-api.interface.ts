import {ISimpleUserApi} from './simple-user-api.interface';
import {ISimpleProjectApi} from './simple-project-api.inferface';
import {ITagApi} from './tag-api.interface';
import {Menu} from './menu';

export interface ITaskApi {
    name: string;
    id?: number;
    finish_date: string;
    finish_time: string;
    suspend_date: string;
    pinned: boolean;
    status: number;
    type_finish_date: number;
    task_project: ISimpleProjectApi;
    owner: ISimpleUserApi;
    owner_pk: number;
    author: ISimpleUserApi;
    percent: number;
    priority: string;
    repeat: number;
    from_repeating: number;
    repeat_delta: number;
    description: string;
    estimate_time: number;
    time: number;
    is_active: boolean;
    creation_date?: string;
    modification_date?: string;
    finish_date_dateformat?: string;
    steps: Array<any>;
    tags: ITagApi[];
    task_list_pk: number;
    when_complete?: any;
    menu_showing?: Menu;
}
