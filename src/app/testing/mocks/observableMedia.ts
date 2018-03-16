import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import {ObservableMedia} from '@angular/flex-layout';
import {SpyObject} from '../test.helpers';

export class MockObservableMedia extends SpyObject {
    constructor() {
        super(ObservableMedia);

    }
    isActive() {
    }
    
    
    getProviders(): Array<any> {
        return [{provide: ObservableMedia, useValue: this}];
    }
}
