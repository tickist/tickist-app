import {ISimpleProjectApi} from './simple-project-api.inferface';

export interface ISimpleUserApi {
    id: number;
    username: string;
    email: string;
    avatar: string;
    avatar_url: string;
    share_with: ISimpleProjectApi[];
}
