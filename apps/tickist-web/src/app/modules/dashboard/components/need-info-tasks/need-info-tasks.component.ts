import {Component, OnInit} from '@angular/core';
import {Store} from "@ngrx/store";
import {needInfoTasks} from "../../../../core/selectors/task.selectors";
import {Observable} from "rxjs";
import {Task, User} from '@data';
import {selectLoggedInUser} from "../../../../core/selectors/user.selectors";
import { NoTasksComponent } from '../../../../single-task/no-tasks/no-tasks.component';
import { SingleTaskComponent } from '../../../../single-task/single-task/single-task.component';
import { NgFor, AsyncPipe } from '@angular/common';

@Component({
    selector: 'tickist-need-info-tasks',
    templateUrl: './need-info-tasks.component.html',
    styleUrls: ['./need-info-tasks.component.scss'],
    standalone: true,
    imports: [NgFor, SingleTaskComponent, NoTasksComponent, AsyncPipe]
})
export class NeedInfoTasksComponent implements OnInit {
    tasks$: Observable<Task[]>
    user$: Observable<User>

    constructor(private store: Store) {
    }

    ngOnInit(): void {
        this.tasks$ = this.store.select(needInfoTasks)
        this.user$ = this.store.select(selectLoggedInUser)
    }

    trackByFn(index, item): number {
        return item.id;
    }

}
