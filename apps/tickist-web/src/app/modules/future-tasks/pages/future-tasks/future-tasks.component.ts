import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { TaskService } from "../../../../core/services/task.service";
import { Observable, Subject } from "rxjs";
import { filter, map, takeUntil } from "rxjs/operators";
import { ActivatedRoute, Router } from "@angular/router";
import { ConfigurationService } from "../../../../core/services/configuration.service";
import { Task } from "@data/tasks/models/tasks";
import { User } from "@data/users/models";
import { FutureTasksFiltersService } from "../../core/services/future-tasks-filters.service";
import { MediaChange, MediaObserver } from "@ngbracket/ngx-layout";
import { updateUser } from "../../../../core/actions/user.actions";
import { Store } from "@ngrx/store";
import { selectLoggedInUser } from "../../../../core/selectors/user.selectors";
import { selectFutureTasksList } from "../../core/selectors/future-tasks.selectors";
import { updateActiveDate } from "../../../../core/actions/active-date.actions";
import { selectActiveDate } from "../../../../core/selectors/active-date.selectors";
import { IActiveDateElement } from "@data/active-data-element.interface";
import { Filter } from "@data/filter";
import { StateActiveDateElement } from "@data/state-active-date-element.enum";
import { TASK_EXTENDED_VIEW } from "@data";
import { format } from "date-fns";

@Component({
    selector: "tickist-future-tasks",
    templateUrl: "./future-tasks.component.html",
    styleUrls: ["./future-tasks.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FutureTasksComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    tasks: Task[] = [];
    tasks$: Observable<Task[]>;
    user: User;
    activeDateElement$: Observable<IActiveDateElement>;
    futureTasks: Task[] = [];
    taskView: string;
    defaultTaskView = TASK_EXTENDED_VIEW.value;
    currentFilter: Filter;

    constructor(
        private taskService: TaskService,
        private route: ActivatedRoute,
        private router: Router,
        private configurationService: ConfigurationService,
        private store: Store,
        private futureTasksFiltersService: FutureTasksFiltersService,
        private cd: ChangeDetectorRef,
        private media: MediaObserver
    ) {}

    ngOnInit(): void {
        this.tasks$ = this.store.select(selectFutureTasksList);
        this.activeDateElement$ = this.store.select(selectActiveDate);
        this.route.params
            .pipe(
                map((params) => (params["date"] ? params["date"] : format(new Date(), "LLLL-uuuu"))),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((param) => {
                this.store.dispatch(
                    updateActiveDate({
                        date: param,
                        state: StateActiveDateElement.future,
                    })
                );
            });

        this.store
            .select(selectLoggedInUser)
            .pipe(
                filter((user) => !!user),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((user) => {
                this.user = user;
                this.defaultTaskView = user.defaultTaskViewFutureView;
            });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    changeTaskView(event): void {
        if (!event) return;
        this.taskView = event;
        if (this.user && this.user.defaultTaskViewFutureView !== event) {
            const user = Object.assign({}, this.user, {
                defaultTaskViewTodayView: event,
            });
            this.store.dispatch(updateUser({ user }));
        }
    }

    trackByFn(index, item) {
        return item.id;
    }
}
