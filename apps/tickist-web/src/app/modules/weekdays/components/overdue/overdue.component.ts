import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Task } from "@data/tasks/models/tasks";
import { TaskService } from "../../../../core/services/task.service";
import { User } from "@data/users/models";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { updateUser } from "../../../../core/actions/user.actions";
import { Store } from "@ngrx/store";
import { selectLoggedInUser } from "../../../../core/selectors/user.selectors";
import { NoTasksComponent } from "../../../../single-task/no-tasks/no-tasks.component";
import { SingleTaskComponent } from "../../../../single-task/single-task/single-task.component";
import { NgFor } from "@angular/common";
import { ChangeTaskViewComponent } from "../../../../shared/components/change-task-view-component/change-task-view.component";
import { MenuButtonComponent } from "../../../../shared/components/menu-button/menu-button.component";
import { FlexModule } from "@ngbracket/ngx-layout/flex";

@Component({
    selector: "tickist-overdue",
    templateUrl: "./overdue.component.html",
    styleUrls: ["./overdue.component.scss"],
    standalone: true,
    imports: [
        FlexModule,
        MenuButtonComponent,
        ChangeTaskViewComponent,
        NgFor,
        SingleTaskComponent,
        NoTasksComponent,
    ],
})
export class OverdueComponent implements OnInit, OnDestroy {
    @Input() tasks: Task[];
    @Input() defaultTaskView: string;
    taskView: string;
    user: User;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    constructor(private taskService: TaskService, private store: Store) {}

    ngOnInit() {
        this.store
            .select(selectLoggedInUser)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((user) => {
                if (user) {
                    this.user = user;
                }
            });
    }

    postponeToToday() {
        this.taskService.postponeToToday();
    }

    changeTaskView(event) {
        this.taskView = event;
        if (this.user.defaultTaskViewOverdueView !== event) {
            const user = Object.assign({}, this.user, {
                defaultTaskViewOverdueView: event,
            });
            this.store.dispatch(updateUser({ user }));
        }
    }

    trackByFn(index, item): number {
        return item.id;
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
