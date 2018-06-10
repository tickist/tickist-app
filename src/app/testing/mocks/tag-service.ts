import {SpyObject} from '../test.helpers';
import {TagService} from '../../services/tag-service';


export class MockTagService extends SpyObject {
  fakeResponse;
  responseSuccess: boolean;

  constructor() {
    super(TagService);

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
    return [{provide: TagService, useValue: this}];
  }
}

