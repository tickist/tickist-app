import {Location} from '@angular/common';
import 'jasmine';

export class MockLocation {
    back: any;

    constructor() {
       // this.back = jasmine.createSpy('back');
    }
    getProviders(): Array<any> {
        return [{provide: Location, useValue: this}];
    }
}
