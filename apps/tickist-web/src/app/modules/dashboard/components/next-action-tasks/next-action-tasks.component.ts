import {Component, OnInit} from '@angular/core';
import {Store} from "@ngrx/store";
import {nextActionTasks} from "../../../../core/selectors/task.selectors";
import {Observable} from "rxjs";
import {Task, User} from '@data';
import {selectLoggedInUser} from "../../../../core/selectors/user.selectors";
import { NoTasksComponent } from '../../../../single-task/no-tasks/no-tasks.component';
import { SingleTaskComponent } from '../../../../single-task/single-task/single-task.component';
import { NgFor, AsyncPipe } from '@angular/common';

@Component({
    selector: 'tickist-next-action-tasks',
    templateUrl: './next-action-tasks.component.html',
    styleUrls: ['./next-action-tasks.component.scss'],
    standalone: true,
    imports: [NgFor, SingleTaskComponent, NoTasksComponent, AsyncPipe]
})
export class NextActionTasksComponent implements OnInit {
    tasks$: Observable<Task[]>
    user$: Observable<User>

    constructor(private store: Store) {
    }

    ngOnInit(): void {
        this.tasks$ = this.store.select(nextActionTasks)
        this.user$ = this.store.select(selectLoggedInUser)
    }

    trackByFn(index, item): number {
        return item.id;
    }


}
