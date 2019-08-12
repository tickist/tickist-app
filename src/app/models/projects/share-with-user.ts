export interface IShareWithUser {
    id: string;
    username: string;
    email: string;
    avatarUrl: string;
}

export class ShareWithUser {
    id: string;
    username: string;
    email: string;
    avatarUrl: string;

    constructor(user: IShareWithUser) {
        Object.assign(this, user);
    }
}
