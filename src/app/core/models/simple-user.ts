import {SimpleProject} from '../../models/projects';
import {ISimpleUserApi} from '../../models/simple-user-api.interface';

export class SimpleUser {
    id: number;
    username: string;
    email: string;
    avatar: string;
    avatarUrl: string;
    shareWith: SimpleProject[] = [];

    constructor(user: ISimpleUserApi) {
        this.id = user.id;
        this.username = user.username;
        this.email = user.email;
        this.avatar = user.avatar;
        this.avatarUrl = user.avatar_url;
        if (user.share_with) {
            user.share_with.forEach((project) => {
                this.shareWith.push(new SimpleProject(project));
            });
        }
    }
}


