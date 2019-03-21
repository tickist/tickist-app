import {IToken} from './token.interface';

export class Token {
    access: string;
    refresh: string;
    userId: number;

    constructor( token: IToken) {
        this.access = token.access.replace('JWT ', '');
        this.refresh = token.refresh.replace('JWT ', '');
        this.userId = token.user_id;

    }
}
