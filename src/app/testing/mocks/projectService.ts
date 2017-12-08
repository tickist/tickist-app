import {SpyObject} from '../test.helpers';
import {ProjectService} from '../../services/projectService';


export class MockProjectService extends SpyObject {
  fakeResponse;
  responseSuccess: boolean;
  team$: any;

  constructor() {
    super(ProjectService);

    this.fakeResponse = null;
    this.responseSuccess = true;
    this.team$ = this.spy('team$').and.returnValue(this);
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
    return [{provide: ProjectService, useValue: this}];
  }
}
