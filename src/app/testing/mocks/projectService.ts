import {SpyObject} from '../test.helpers';
import {ProjectService} from '../../services/projectService';
import {Observable} from 'rxjs/Observable';


export class MockProjectService extends SpyObject {
  fakeResponse;
  responseSuccess: boolean;
  team$: any;
  selectedProjectsIds$: any;
  projects$: any;
  selectedProject$: any;

  constructor() {
    super(ProjectService);

    this.fakeResponse = null;
    this.responseSuccess = true;
    this.team$ = Observable.of([]);
    this.selectedProjectsIds$ = Observable.of([]);
    this.selectedProject$ = Observable.of([]);
    this.projects$ = Observable.of([]);
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
