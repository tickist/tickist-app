import {SpyObject} from '../test.helpers';
import {TasksFiltersService} from '../../core/services/tasks-filters.service';
import {of} from 'rxjs';


export class MockTasksFiltersService extends SpyObject {
    currentTasksFilters$: any;


    constructor() {
        super(TasksFiltersService);
        this.currentTasksFilters$ = of([]);

    }

    getProviders(): Array<any> {
        return [{provide: TasksFiltersService, useValue: this}];
    }
}
