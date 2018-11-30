import {UserService} from '../../services/user.service';
import {SpyObject} from '../test.helpers';
import {User} from '../../models/user/user';
import {Observable, of} from 'rxjs';


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
    this.user$ = of(new User({id: 1}));
    // this.login = this.spy('login').andReturn(this);
    // this.logout = this.spy('logout').andReturn(this);
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
