import {SpyObject} from '../test.helpers';
import {of} from 'rxjs';
import {FutureTasksFiltersService} from '../../services/future-tasks-filters.service';


export class MockFutureTasksFiltersService extends SpyObject {
    fakeResponse;
    responseSuccess: boolean;
    currentFutureTasksFilters$: any;
    futureTasksFilters$: any;

    constructor() {
        super(FutureTasksFiltersService);
        this.fakeResponse = null;
        this.responseSuccess = true;
        this.currentFutureTasksFilters$ = of([]);
        this.futureTasksFilters$ = of([]);
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
        return [{provide: FutureTasksFiltersService, useValue: this}];
    }
}
