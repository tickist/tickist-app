import {SpyObject} from '../test.helpers';
import {TaskService} from '../../services/taskService';


export class MockTaskService extends SpyObject {
  fakeResponse;
  responseSuccess: boolean;

  constructor() {
    super(TaskService);

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
    return [{provide: TaskService, useValue: this}];
  }
}
