import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Project} from '../../models/projects';
import {TaskService} from '../../services/task.service';
import {Observable} from 'rxjs';

@Injectable()
export class CloseMenuInTasksResolver implements Resolve<Project> {
    constructor(private taskService: TaskService) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
        return this.taskService.closeMenuInTasks();
    }
}
