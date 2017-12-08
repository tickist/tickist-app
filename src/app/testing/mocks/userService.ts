import {UserService} from '../../services/userService';
import {SpyObject} from "../test.helpers";



export class MockUserService extends SpyObject{
  login;
  logout;
  fakeResponse;
  responseSuccess: boolean;

  constructor() {
    super(UserService);
    this.fakeResponse = null;
    this.responseSuccess = true;
    //this.login = this.spy('login').andReturn(this);
    //this.logout = this.spy('logout').andReturn(this);
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
