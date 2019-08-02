import {Component, Input, OnInit} from '@angular/core';
import {AppStore} from '../../../../store';
import {Project} from '../../../../models/projects';
import {Store} from '@ngrx/store';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Task} from '../../../../models/tasks/tasks';
import {toSnakeCase} from '../../../../core/utils/toSnakeCase';
import {User} from '../../../../core/models';
import {selectLoggedInUser} from '../../../../core/selectors/user.selectors';
import {RequestCreateTask} from '../../../../core/actions/tasks/task.actions';
import {convertToSimpleProject} from '../../../../core/utils/projects-utils';

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

            const task = new Task(<any>{
                'name': taskName,
                'priority': this.project.defaultPriority,
                'description': '',
                'typeFinishDate': 1,
                'finish_date': '',
                'finish_time': '',
                'suspend_date': '',
                'repeat': 0,
                'owner': toSnakeCase(this.user.convertToSimpleUser()),
                'owner_pk': this.user.id,
                'author': toSnakeCase(this.user.convertToSimpleUser()),
                'repeat_delta': 1,
                'from_repeating': 0,
                'task_project': toSnakeCase(convertToSimpleProject(this.project)),
                'estimate_time': 0,
                'task_list_pk': this.project.id,
                'time': undefined,
                'steps': [],
                'tags': [],
                'status': 0,
                'is_active': true,
                'percent': 0,
                'pinned': false,
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

            return task;
    }

    createTask(values) {
        this.store.dispatch(new RequestCreateTask({task: this.createTaskModel(values.name)}));
        this.createTaskForm.reset();

    }

}
