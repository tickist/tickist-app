import {UserService} from '../../user/user.service';
import {SpyObject} from '../test.helpers';
import {User} from '../../user/models';
import {Observable, of} from 'rxjs';
import {UsersApiMockFactory} from './api-mock/users-api-mock.factory';


export class MockUserService extends SpyObject {
    login;
    logout;
    fakeResponse;
    responseSuccess: boolean;
    user$: any;
    usersApiMockFactory: UsersApiMockFactory;

    constructor() {
        super(UserService);
        this.usersApiMockFactory = new UsersApiMockFactory();
        this.fakeResponse = null;
        this.responseSuccess = true;
        this.user$ = of(new User(this.usersApiMockFactory.createUserDict()));
    }

    subscribe(success, error) {
        if (this.responseSuccess) {
            success(this.fakeResponse);
        } else {
            error(this.fakeResponse);
        }
    }

    setErrorResponse() {
        this.responseSuccess = false;
    }

    setResponse(json: any): void {
        this.fakeResponse = json;
    }

    getProviders(): Array<any> {
        return [{provide: UserService, useValue: this}];
    }
}
