import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Task} from '../../models/tasks';
import {TaskService} from '../../tasks/task.service';
import {Observable} from 'rxjs';
import {Store} from '@ngrx/store';
import {RequestsAllTasks} from '../../tasks/task.actions';
import {AppStore} from '../../store';

@Injectable()
export class TasksResolver implements Resolve<Task> {
    constructor(private store: Store<AppStore>) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
        return  this.store.dispatch(new RequestsAllTasks());
    }
}
