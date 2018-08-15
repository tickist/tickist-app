import {Observable, pipe} from 'rxjs';
import {Injectable} from '@angular/core';
import {Store, State} from '@ngrx/store';
import {environment} from '../../environments/environment';
import {AppStore} from '../store';
import {Task} from '../models/tasks';
import {UserService} from './userService';
import {MatSnackBar} from '@angular/material';
import {StatisticsService} from './statisticsService';
import {ConfigurationService} from './configurationService';
import {TagService} from './tag-service';
import {ProjectService} from './project-service';
import * as tasksAction from '../reducers/actions/tasks';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';


@Injectable()
export class TaskService {
    tasks$: Observable<Task[]>;
    
    constructor(public http: HttpClient, private store: Store<AppStore>, private userService: UserService,
                public snackBar: MatSnackBar, protected statisticsService: StatisticsService,
                protected configurationService: ConfigurationService, protected projectService: ProjectService,
                protected tagService: TagService) {

        this.tasks$ = this.store.select(s => s.tasks);
    }

    loadTasks() {
        return this.http.get<Task[]>(`${environment['apiUrl']}/tasks/?assign=all&status=0&status=2`)
            .pipe(
                map(payload => payload.map(task => new Task(task))),
                map(payload => this.store.dispatch(new tasksAction.AddTasks(payload)))
            );
    }

    saveTask(task: Task) {
        (task.id) ? this.updateTask(task) : this.createTask(task);
    }

    postponeToToday() {
        this.http.post<Task[]>(`${environment['apiUrl']}/tasks/move_tasks_for_today/`, {}).subscribe((tasks: Task[]) => {
            tasks.map((task) => {
                this.store.dispatch(new tasksAction.UpdateTask(task));
            });
        });
    }

    createTask(task: Task) {
        this.http.post(`${environment['apiUrl']}/tasks/`, task.toApi())
            .pipe(map(payload => new Task(payload)))
            .subscribe(payload => {
                this.snackBar.open('Task has been saved successfully', '', {
                    duration: 2000,
                });
                this.store.dispatch(new tasksAction.CreateTask(payload));
            });
    }

    updateTask(task: Task, isSilenceUpdate = false, cleanMenuState = false): void {
        let menuStateCopy;
        if (!cleanMenuState) {
            menuStateCopy = task.toApi()['menu_showing'];
        }
        this.configurationService.switchOnProgressBar();
        this.http.put(`${environment['apiUrl']}/tasks/${task.id}/`, task.toApi())
            .subscribe(payload => {
                // this.snackBar.open('Task has been updated successfully', '', {
                //   duration: 2000,
                // });
                if (!cleanMenuState) {
                    payload['menu_showing'] = menuStateCopy;
                }
                this.store.dispatch(new tasksAction.UpdateTask(new Task(payload)));
                if (!isSilenceUpdate) {
                    this.statisticsService.loadAllStatistics(undefined);
                }
                this.configurationService.switchOffProgressBar();
                this.projectService.loadProjects().subscribe();
                this.tagService.loadTags().subscribe();
            });
    }

    deleteTask(task: Task) {
        this.http.delete(`${environment['apiUrl']}/tasks/${task.id}/`)
            .subscribe(action => {
                this.store.dispatch(new tasksAction.DeleteTask(task));
                this.snackBar.open('Task has been deleted successfully', '', {
                    duration: 2000,
                });
            });
    }

}
