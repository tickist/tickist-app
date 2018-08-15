import {SpyObject} from '../test.helpers';
import {TasksFiltersService} from '../../services/tasks-filters.service';
import {of} from 'rxjs';


export class MockTasksFiltersService extends SpyObject {
    currentTasksFilters$: any;


    constructor() {
        super(TasksFiltersService);

    }
    
    getProviders(): Array<any> {
        return [{provide: TasksFiltersService, useValue: this}];
    }
}
