import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Project} from '../../../../../../libs/data/src/projects/models';
import {TasksFiltersService} from '../../core/services/tasks-filters.service';
import {Observable} from 'rxjs';

@Injectable()
export class SetAllTasksFilterResolver implements Resolve<Project> {
    constructor(private tasksFiltersService: TasksFiltersService) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
        return this.tasksFiltersService.setAllTasksFilter();
    }
}
