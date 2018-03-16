import {SpyObject} from '../test.helpers';
import {TaskService} from '../../services/taskService';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';

export class MockTaskService extends SpyObject {
    fakeResponse;
    responseSuccess: boolean;
    currentTasksFilters$: any;
    tasks$: any;
    
    constructor() {
        super(TaskService);
        this.fakeResponse = null;
        this.responseSuccess = true;
        this.currentTasksFilters$ =  this.spy('activeDay$').and.returnValue(Observable.of([]));
        this.tasks$ =  this.spy('activeDay$').and.returnValue(Observable.of([]));
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
