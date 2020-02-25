import {Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {environment} from '../../../environments/environment';
import {AppStore} from '../../store';
import {Task} from '@data/tasks/models/tasks';
import {selectAllTasks} from '../selectors/task.selectors';
import {AngularFirestore} from '@angular/fire/firestore';
import {setStatusDoneLogic} from '../../single-task/utils/set-status-to-done-logic';
import {Editor, User} from '@data/users';


const tasksCollectionName = 'tasks';

@Injectable({
    providedIn: 'root',
})
export class TaskService {
    tasks$: Observable<Task[]>;

    constructor(private db: AngularFirestore, private store: Store<{}>) {

        this.tasks$ = this.store.select(selectAllTasks);
    }

    // saveTask(task: Task) {
    //     (task.id) ? this.updateTask(task) : this.createTask(task);
    // }

    postponeToToday() {
        // this.http.post<Task[]>(`${environment['apiUrl']}/tasks/move_tasks_for_today/`, {}).subscribe((tasks: Task[]) => {
        // });
    }

    createTask(task: Task, user: User) {
        const newTask = this.db.collection(tasksCollectionName).ref.doc();
        const editor = {
            id: user.id,
            email: user.email,
            username: user.username
        } as Editor;

        return newTask.set(JSON.parse(JSON.stringify({...task, id: newTask.id, lastEditor: editor})));
    }

    updateTask(task: Task, user: User) {
        const editor = {
            id: user.id,
            email: user.email,
            username: user.username
        } as Editor;
        const taskWithLastEditor = {...task, lastEditor: editor};
        return this.db.collection(tasksCollectionName).doc(task.id).update(JSON.parse(JSON.stringify(taskWithLastEditor)));



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

    setStatusDone(task: Task, user: User) {
        return this.updateTask(setStatusDoneLogic(task), user);
    }

    deleteTask(taskId: string) {
        return this.db.collection(tasksCollectionName).doc(taskId).update({isActive: false});
    }

}
