import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Project} from '../../models/projects';
import {TasksFiltersService} from '../../services/tasks-filters.service';
import {Observable} from 'rxjs';

@Injectable()
export class SetAllTasksFilterResolver implements Resolve<Project> {
    constructor(protected tasksFiltersService: TasksFiltersService) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
        return this.tasksFiltersService.setAllTasksFilter();
    }
}
