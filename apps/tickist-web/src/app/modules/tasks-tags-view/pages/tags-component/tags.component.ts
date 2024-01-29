import { Component, OnDestroy, OnInit } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { Tag } from "@data/tags/models/tags";
import { Task } from "@data/tasks/models/tasks";
import { User } from "@data/users/models";
import { Store } from "@ngrx/store";
import { selectTasksStreamInTagsView } from "../../../../core/selectors/task.selectors";
import { selectLoggedInUser } from "../../../../core/selectors/user.selectors";
import { takeUntil } from "rxjs/operators";
import { updateUser } from "../../../../core/actions/user.actions";
import { TASK_EXTENDED_VIEW } from "@data";
import { AsyncPipe } from "@angular/common";
import { NoTasksComponent } from "../../../../single-task/no-tasks/no-tasks.component";
import { SingleTaskComponent } from "../../../../single-task/single-task/single-task.component";
import { FilterTasksComponent } from "../../../../tasks/filter-tasks/filter-tasks.component";
import { ChangeTaskViewComponent } from "../../../../shared/components/change-task-view-component/change-task-view.component";
import { FlexModule } from "@ngbracket/ngx-layout/flex";
import { CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from "@angular/cdk/scrolling";

@Component({
    selector: "tickist-tags",
    templateUrl: "./tags.component.html",
    styleUrls: ["./tags.component.scss"],
    standalone: true,
    imports: [
        CdkVirtualScrollViewport,
        CdkFixedSizeVirtualScroll,
        FlexModule,
        ChangeTaskViewComponent,
        FilterTasksComponent,
        CdkVirtualForOf,
        SingleTaskComponent,
        NoTasksComponent,
        AsyncPipe,
    ],
})
export class TagsComponent implements OnInit, OnDestroy {
    tags: Tag[];
    tasks: Task[];
    tasks$: Observable<Task[]>;
    user: User;
    defaultTaskView = TASK_EXTENDED_VIEW.value;
    taskView: string;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    constructor(private store: Store) {}

    ngOnInit() {
        this.tasks$ = this.store.select(selectTasksStreamInTagsView);
        this.store
            .select(selectLoggedInUser)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((user) => {
                this.user = user;
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        // clearTimeout(this.timer);
    }

    changeTaskView(event) {
        this.taskView = event;
        if (this.user && this.user.defaultTaskViewTagsView !== event) {
            const user = Object.assign({}, this.user, { defaultTaskViewTodayView: event });
            this.store.dispatch(updateUser({ user }));
        }
    }

    trackByFn(index, item): number {
        return item.id;
    }
}
