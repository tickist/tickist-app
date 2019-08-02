interface IPendingUser {
    id: string;
    username: string;
    email: string;
    status: string;
}


export class ShareWithPendingUser {
    username: string;
    avatarUrl: string;
    email: string;
    status: string;
    id: string;

    constructor({id, username, email, status}: IPendingUser) {
        this.id = id;
        this.username = username;
        this.status = status;
        this.email = email;
        this.status = status;


    }
}
