import {ActivatedRoute} from '@angular/router';
import {of} from 'rxjs';


export class MockActivatedRoute extends ActivatedRoute {
    constructor() {
        super();
        this.params = of({id: '1'});
    }
    
    getProviders(): Array<any> {
        return [{provide: ActivatedRoute, useValue: this}];
    }
}
