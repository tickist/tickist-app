import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs";
import { Store } from "@ngrx/store";
import { needInfoTasksLength, nextActionTasksLength, projectWithoutNextActionTasksLength } from "../../../../core/selectors/task.selectors";
import { AsyncPipe } from "@angular/common";
import { ProjectWithoutNextActionTasksComponent } from "../project-without-next-action-tasks/project-without-next-action-tasks.component";
import { NeedInfoTasksComponent } from "../need-info-tasks/need-info-tasks.component";
import { NextActionTasksComponent } from "../next-action-tasks/next-action-tasks.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatExpansionModule } from "@angular/material/expansion";

@Component({
    selector: "tickist-dashboard",
    templateUrl: "./dashboard.component.html",
    styleUrls: ["./dashboard.component.scss"],
    standalone: true,
    imports: [
        MatExpansionModule,
        FaIconComponent,
        NextActionTasksComponent,
        NeedInfoTasksComponent,
        ProjectWithoutNextActionTasksComponent,
        AsyncPipe,
    ],
})
export class DashboardComponent implements OnInit {
    nextActionTasksLength$: Observable<number>;
    needInfoTasksLength$: Observable<number>;
    projectWithoutNextActionTasksLength$: Observable<number>;

    constructor(private store: Store) {}

    ngOnInit(): void {
        this.nextActionTasksLength$ = this.store.select(nextActionTasksLength);
        this.needInfoTasksLength$ = this.store.select(needInfoTasksLength);
        this.projectWithoutNextActionTasksLength$ = this.store.select(projectWithoutNextActionTasksLength);
    }
}
