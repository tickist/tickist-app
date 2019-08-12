
export interface  ITaskUser {
    id: string;
    username: string;
    email: string;
    avatarUrl: string;

}

export class TaskUser {
    id: string;
    username: string;
    email: string;
    avatarUrl: string;

    constructor(kwargs: ITaskUser) {
        this.id = kwargs.id;
        this.username = kwargs.username;
        this.email = kwargs.email;
        this.avatarUrl = kwargs.avatarUrl;
    }
}
