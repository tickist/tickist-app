import {SimpleProject} from '../../projects';
import {DEFAULT_USER_AVATAR} from '../config-user';


export class SimpleUser {
    id: string;
    username: string;
    email: string;
    avatar: string;
    avatarUrl: string;
    shareWith: SimpleProject[] = [];

    constructor(user: any) {
        this.id = user.id;
        this.username = user.username;
        this.email = user.email;
        this.avatar = user.avatar;
        this.avatarUrl = user.avatar_url;
        if (!this.avatarUrl) this.avatarUrl = DEFAULT_USER_AVATAR;
        if (user.share_with) {
            user.share_with.forEach((project) => {
                this.shareWith.push(new SimpleProject(project));
            });
        }
    }
}


