import {Component, OnInit} from '@angular/core';
import {Observable} from "rxjs";
import {Store} from "@ngrx/store";
import {
    needInfoTasksLength,
    nextActionTasksLength,
    projectWithoutNextActionTasksLength
} from "../../../../core/selectors/task.selectors";

@Component({
    selector: 'tickist-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    nextActionTasksLength$: Observable<number>
    needInfoTasksLength$: Observable<number>
    projectWithoutNextActionTasksLength$: Observable<number>
    constructor(private store: Store) {
    }

    ngOnInit(): void {
        this.nextActionTasksLength$ = this.store.select(nextActionTasksLength);
        this.needInfoTasksLength$ = this.store.select(needInfoTasksLength);
        this.projectWithoutNextActionTasksLength$ = this.store.select(projectWithoutNextActionTasksLength);
    }

}
