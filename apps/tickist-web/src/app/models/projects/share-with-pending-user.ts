export interface IPendingUser {
    id: string;
    username: string;
    email: string;
    status: string;
}


export class ShareWithPendingUser {
    username: string;
    email: string;
    status: string;
    id: string;

    constructor(user: IPendingUser) {
        Object.assign(this, user);
    }
}
