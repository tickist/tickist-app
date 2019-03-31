import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {homeRoutesName} from '../../../routing.module';
import {editTaskRoutesName} from '../../../modules/edit-task/routes-names';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {AppStore} from '../../../store';
import {selectAddTaskButtonVisibility} from '../../../reducers/core.selectors';
import {Observable} from 'rxjs';

@Component({
    selector: 'tickist-add-task',
    templateUrl: './add-task.component.html',
    styleUrls: ['./add-task.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddTaskComponent implements OnInit {
    addTaskButtonVisibility$: Observable<boolean>;

    constructor(private store: Store<AppStore>, private router: Router) {
    }

    ngOnInit() {
        this.addTaskButtonVisibility$ = this.store.select(selectAddTaskButtonVisibility);
    }

    navigateToCreateNewTask() {
        this.router.navigate([homeRoutesName.HOME, {outlets: {content: [editTaskRoutesName.EDIT_TASK]}}]);
    }
}
