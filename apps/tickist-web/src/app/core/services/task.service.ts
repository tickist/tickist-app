import {Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {environment} from '../../../environments/environment';
import {AppStore} from '../../store';
import {Task} from '../../models/tasks/tasks';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ConfigurationService} from './configuration.service';
import {TagService} from './tag.service';
import {ProjectService} from './project.service';
import {HttpClient} from '@angular/common/http';
import {selectAllTasks} from '../selectors/task.selectors';
import {AngularFirestore} from '@angular/fire/firestore';
import {setStatusDoneLogic} from '../../single-task/utils/set-status-to-done-logic';


const tasksCollectionName = 'tasks';

@Injectable()
export class TaskService {
    tasks$: Observable<Task[]>;

    constructor(private db: AngularFirestore, public http: HttpClient, private store: Store<AppStore>,
                public snackBar: MatSnackBar,
                private configurationService: ConfigurationService, private projectService: ProjectService,
                private tagService: TagService) {

        this.tasks$ = this.store.select(selectAllTasks);
    }

    saveTask(task: Task) {
        (task.id) ? this.updateTask(task) : this.createTask(task);
    }

    postponeToToday() {
        this.http.post<Task[]>(`${environment['apiUrl']}/tasks/move_tasks_for_today/`, {}).subscribe((tasks: Task[]) => {
        });
    }

    createTask(task: Task) {
        const newTask = this.db.collection(tasksCollectionName).ref.doc();
        return newTask.set(JSON.parse(JSON.stringify({...task, id: newTask.id})));
    }

    updateTask(task: Task, isSilenceUpdate = false, cleanMenuState = false) {
        return this.db.collection(tasksCollectionName).doc(task.id).update(JSON.parse(JSON.stringify(task)));



        // let menuStateCopy;
        // if (!cleanMenuState) {
        //     menuStateCopy = task.menuShowing;
        // }
        // return this.http.put<any>(`${environment['apiUrl']}/tasks/${task.id}/`, taskToSnakeCase(task))
        //     .pipe(map((payload: any) => new Task(payload)),
        //         map(payload => {
        //             if (!cleanMenuState) {
        //                 return Object.assign({}, payload, {'menuShowing': menuStateCopy});
        //             }
        //             return payload;
        //         }));

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

    setStatusDone(task: Task) {
        return this.updateTask(setStatusDoneLogic(task));
    }

    deleteTask(taskId: string) {
        return this.db.collection(tasksCollectionName).doc(taskId).update({isActive: false});
    }

}
