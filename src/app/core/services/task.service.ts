import {Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {Store, State, select} from '@ngrx/store';
import {environment} from '../../../environments/environment';
import {AppStore} from '../../store';
import {Task} from '../../models/tasks';
import {MatSnackBar} from '@angular/material';
import {StatisticsService} from '../../services/statistics.service';
import {ConfigurationService} from '../../services/configuration.service';
import {TagService} from '../../services/tag.service';
import {ProjectService} from '../../services/project.service';
import * as tasksAction from '../../reducers/actions/tasks';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {ITaskApi} from '../../models/task-api.interface';
import {selectAllTasks} from '../selectors/task.selectors';
import {taskToSnakeCase} from '../../single-task/utils/taskToSnakeCase';


@Injectable()
export class TaskService {
    tasks$: Observable<Task[]>;

    constructor(public http: HttpClient, private store: Store<AppStore>,
                public snackBar: MatSnackBar,
                private configurationService: ConfigurationService, private projectService: ProjectService,
                private tagService: TagService) {

        this.tasks$ = this.store.select(selectAllTasks);
    }

    loadTasks() {
        return this.http.get<ITaskApi[]>(`${environment['apiUrl']}/tasks/?assign=all&status=0&status=2`)
            .pipe(
                map(payload => payload.map((task: ITaskApi) => new Task(task))),
            );
    }

    saveTask(task: Task) {
        (task.id) ? this.updateTask(task) : this.createTask(task);
    }

    postponeToToday() {
        this.http.post<Task[]>(`${environment['apiUrl']}/tasks/move_tasks_for_today/`, {}).subscribe((tasks: Task[]) => {
        });
    }

    createTask(task: Task) {
        return this.http.post(`${environment['apiUrl']}/tasks/`, taskToSnakeCase(task))
            .pipe(map((payload: ITaskApi) => new Task(payload)));
    }

    updateTask(task: Task, isSilenceUpdate = false, cleanMenuState = false) {
        let menuStateCopy;
        if (!cleanMenuState) {
            menuStateCopy = taskToSnakeCase(task)['menu_showing'];
        }
        return this.http.put<ITaskApi>(`${environment['apiUrl']}/tasks/${task.id}/`, taskToSnakeCase(task))
            .pipe(map((payload: ITaskApi) => new Task(payload)));
            // .subscribe(payload => {
            //     if (!cleanMenuState) {
            //         payload['menu_showing'] = menuStateCopy;
            //     }
            //     if (!isSilenceUpdate) {
            //         this.statisticsService.loadAllStatistics(undefined);
            //     }
            //     this.configurationService.switchOffProgressBar();
            //     this.projectService.loadProjects().subscribe();
            //     this.tagService.loadTags().subscribe();
            // });
    }

    deleteTask(taskId: number) {
        return this.http.delete(`${environment['apiUrl']}/tasks/${taskId}/`);
    }

}
