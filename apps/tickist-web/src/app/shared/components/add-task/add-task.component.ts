import {Component, Input, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {Project, Task, TaskProject, TaskUser, User} from "@data";
import {Subject} from "rxjs";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {selectLoggedInUser} from "../../../core/selectors/user.selectors";
import {takeUntil} from "rxjs/operators";
import {Store} from "@ngrx/store";
import {requestCreateTask} from "../../../core/actions/tasks/task.actions";

@Component({
    selector: 'tickist-add-task',
    templateUrl: './add-task.component.html',
    styleUrls: ['./add-task.component.scss']
})
export class AddTaskComponent implements OnInit, OnDestroy, OnChanges {
    @Input() project: Project;
    @Input() enableLastElement = false;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    createTaskForm: FormGroup;
    user: User;
    showCreateTaskForm = false;

    constructor(private store: Store) {
        this.createTaskForm = new FormGroup({
            'name': new FormControl('', Validators.required)
        });
    }

    ngOnInit(): void {
        this.store.select(selectLoggedInUser).pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe(user => this.user = user);
    }

    ngOnChanges() {
        this.showCreateTaskForm = !!this.project;
    }

    private createTaskModel(taskName: string) {

        return new Task(<any>{
            'name': taskName,
            'priority': this.project.defaultPriority,
            'description': '',
            'finishDate': '',
            'finishTime': '',
            'suspendDate': '',
            'repeat': 0,
            'owner': new TaskUser(this.user),
            'ownerPk': this.user.id,
            'author': new TaskUser(this.user),
            'repeatDelta': 1,
            'fromRepeating': 0,
            'taskProject': new TaskProject(this.project),
            'estimate_time': 0,
            'taskListPk': this.project.id,
            'time': undefined,
            'steps': [],
            'tags': []
        });
    }

    createTask(values) {
        this.createTaskForm.reset();
        Object.keys(this.createTaskForm.controls).forEach(key => {
            this.createTaskForm.get(key).setErrors(null) ;
        });
        this.store.dispatch(requestCreateTask({task: this.createTaskModel(values.name)}));
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
