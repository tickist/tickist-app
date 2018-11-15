import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Task} from '../models/tasks';
import {TaskService} from '../services/task-service';
import {Observable} from 'rxjs';

@Injectable()
export class TasksResolver implements Resolve<Task> {
    constructor(private taskService: TaskService) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
        return this.taskService.loadTasks();
    }
}
