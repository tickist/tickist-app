import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import {ObservableMedia} from '@angular/flex-layout';
import {SpyObject} from '../test.helpers';

export class MockObservableMedia extends SpyObject {
    fakeResponse: any;
    media: any;
    responseSuccess = true;
    
    constructor() {
        super(ObservableMedia);
        this.media = this;

    }
    isActive() {
    }
    
    subscribe(success, error) {
        if (this.responseSuccess) {
          success(this.fakeResponse);
        } else {
          error(this.fakeResponse);
        }
    }

    
    getProviders(): Array<any> {
        return [{provide: ObservableMedia, useValue: this}];
    }
}
