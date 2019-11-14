import {Location} from '@angular/common';


export class MockLocation {
    back: any;

    constructor() {
       // this.back = jasmine.createSpy('back');
    }
    getProviders(): Array<any> {
        return [{provide: Location, useValue: this}];
    }
}
