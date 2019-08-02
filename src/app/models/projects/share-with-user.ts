interface IShareWithUser {
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

    constructor({id, username, email, avatarUrl}: IShareWithUser) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.avatarUrl = avatarUrl;
    }
}
