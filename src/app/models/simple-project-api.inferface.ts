
import {ISimpleUserApi} from './simple-user-api.interface';
import {IPendingUser} from './pending-user-api.interface';


export interface ISimpleProjectApi {
    id: number;
    name: string;
    color: string;
    dialog_time_when_task_finished: boolean;
    share_with: (ISimpleUserApi | IPendingUser)[];
}
