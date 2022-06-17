import { UserService } from "../../core/services/user.service";
import { SpyObject } from "../test.helpers";

export class MockUserService extends SpyObject {
    login;
    logout;
    fakeResponse;
    responseSuccess: boolean;
    user$: any;

    constructor() {
        super(UserService);

        this.fakeResponse = null;
        this.responseSuccess = true;
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
        return [{ provide: UserService, useValue: this }];
    }
}
