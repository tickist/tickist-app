import {Component, Input, OnInit} from '@angular/core';
import {AppStore} from '../../../../store';
import {Project} from '../../../../../../../../libs/data/src/lib/projects/models';
import {Store} from '@ngrx/store';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Task} from '../../../../../../../../libs/data/src/lib/tasks/models/tasks';
import {toSnakeCase} from '../../../../core/utils/toSnakeCase';
import {User} from '../../../../../../../../libs/data/src/lib/users/models';
import {selectLoggedInUser} from '../../../../core/selectors/user.selectors';
import {RequestCreateTask} from '../../../../core/actions/tasks/task.actions';
import {convertToSimpleProject} from '../../../../core/utils/projects-utils';
import {TaskUser} from '../../../../../../../../libs/data/src/lib/tasks/models/task-user';
import {TaskProject} from '../../../../../../../../libs/data/src/lib/tasks/models/task-project';

@Component({
    selector: 'tickist-add-task-tree-view',
    templateUrl: './add-task-tree-view.component.html',
    styleUrls: ['./add-task-tree-view.component.scss']
})
export class AddTaskTreeViewComponent implements OnInit {
    @Input() project: Project;
    createTaskForm: FormGroup;
    user: User;

    constructor(private store: Store<AppStore>) {
        this.createTaskForm = new FormGroup({
            'name': new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        this.store.select(selectLoggedInUser).subscribe(user => this.user = user);
    }

    createTaskModel(taskName: string) {
            // let defaultTypeFinishDate = 1;
            // const finishDateOption = this.defaultFinishDateOptions
            //     .find((defaultFinishDateOption) => defaultFinishDateOption.id === selectedProject.defaultFinishDate);
            // const isTypeFinishDateOptionsDefined = this.typeFinishDateOptions
            //     .some(typeFinishDateOption => typeFinishDateOption.id === selectedProject.defaultTypeFinishDate);

            // if (isTypeFinishDateOptionsDefined) {
            //     defaultTypeFinishDate = this.project.defaultTypeFinishDate;
            // }

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

            // if (finishDateOption) {
            //     if (finishDateOption.name === 'today') {
            //         task = moveFinishDateFromPreviousFinishDate(task, 'today');
            //     } else if (finishDateOption.name === 'tomorrow') {
            //         task = moveFinishDateFromPreviousFinishDate(task, 1);
            //     } else if (finishDateOption.name === 'next week') {
            //         task = moveFinishDateFromPreviousFinishDate(task, 7);
            //     } else if (finishDateOption.name === 'next month') {
            //         task = moveFinishDateFromPreviousFinishDate(task, 30);
            //     }
            // }

    }

    createTask(values) {
        this.store.dispatch(new RequestCreateTask({task: this.createTaskModel(values.name)}));
        this.createTaskForm.reset();

    }

}
