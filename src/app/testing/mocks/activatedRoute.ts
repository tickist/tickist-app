import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';

export class MockActivatedRoute extends ActivatedRoute {
    constructor() {
        super();
        this.params = Observable.of({id: '1'});
    }
    
    getProviders(): Array<any> {
        return [{provide: ActivatedRoute, useValue: this}];
    }
}
