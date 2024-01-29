import { Component, OnDestroy, OnInit } from "@angular/core";
import { TaskService } from "../../../../core/services/task.service";
import { UserService } from "../../../../core/services/user.service";
import { ConfigurationService } from "../../../../core/services/configuration.service";
import { Task } from "@data/tasks/models/tasks";
import { ActivatedRoute, Router } from "@angular/router";
import { combineLatest, Observable, Subject } from "rxjs";
import { User } from "@data/users/models";
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as _ from "lodash";
import { MediaChange, MediaObserver } from "@ngbracket/ngx-layout";
import { map, takeUntil } from "rxjs/operators";
import { updateActiveDate } from "../../../../core/actions/active-date.actions";
import { Store } from "@ngrx/store";
import { selectActiveDate } from "../../../../core/selectors/active-date.selectors";
import { IActiveDateElement } from "@data/active-data-element.interface";
import { StateActiveDateElement } from "@data/state-active-date-element.enum";
import { addDays, format } from "date-fns";
import { OverdueComponent } from "../../components/overdue/overdue.component";
import { TodayComponent } from "../../components/today/today.component";
import { FlexModule } from "@ngbracket/ngx-layout/flex";
import { NgIf } from "@angular/common";

@Component({
    selector: "tickist-weekdays",
    templateUrl: "./weekdays.component.html",
    styleUrls: ["./weekdays.component.scss"],
    standalone: true,
    imports: [
        NgIf,
        FlexModule,
        TodayComponent,
        OverdueComponent,
    ],
})
export class WeekdaysComponent implements OnInit, OnDestroy {
    todayTasks: Task[] = [];
    overdueTasks: Task[] = [];
    tasks: Task[] = [];
    activeDateElement: IActiveDateElement;
    today: Date;
    stream$: Observable<any>;
    user: User;
    mediaChange: MediaChange;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private taskService: TaskService,
        protected route: ActivatedRoute,
        private userService: UserService,
        private configurationService: ConfigurationService,
        protected router: Router,
        protected media: MediaObserver,
        private store: Store,
    ) {
        this.stream$ = combineLatest([this.taskService.tasks$, this.store.select(selectActiveDate), this.userService.user$]);
        this.changeActiveDayAfterMidnight();
    }

    changeActiveDayAfterMidnight() {}

    isToday(activeDateElement = this.activeDateElement) {
        const today = format(new Date(), "dd-MM-yyyy");
        return today === format(activeDateElement.date, "dd-MM-yyyy");
    }

    isTomorrow(activeDateElement = this.activeDateElement) {
        const tomorrow = format(addDays(new Date(), 1), "dd-MM-yyyy");
        return tomorrow === format(activeDateElement.date, "dd-MM-yyyy");
    }

    ngOnInit() {
        this.stream$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(([tasks, activeDateElement, user]) => {
            this.activeDateElement = activeDateElement;
            this.user = user;
            if (tasks && tasks.length > 0 && this.user) {
                this.tasks = tasks.filter((task) => task.owner.id === this.user.id && task.isDone === false && task.onHold === false);
                this.todayTasks = this.tasks.filter(
                    (task: Task) =>
                        (task.finishDate && format(task.finishDate, "dd-MM-yyyy") === format(this.activeDateElement.date, "dd-MM-yyyy")) ||
                        (task.pinned === true && this.isToday()),
                );

                this.overdueTasks = this.tasks.filter(
                    (task: Task) => task.pinned === false && task.finishDate && task.finishDate < this.activeDateElement.date,
                );

                const overdueTasksSortBy = JSON.parse(this.user.overdueTasksSortBy);
                this.todayTasks = _.orderBy(
                    this.todayTasks,
                    ["priority", "finishDate", "finishTime", (task) => _.deburr(task.name.toLowerCase())],
                    ["asc", "desc", "asc", "asc"],
                );
                this.overdueTasks = _.orderBy(this.overdueTasks, overdueTasksSortBy.fields, overdueTasksSortBy.orders);
            }
        });
        this.route.params
            .pipe(
                map((params) => params["date"]),
                takeUntil(this.ngUnsubscribe),
            )
            .subscribe((param) => {
                if (param) {
                    this.store.dispatch(
                        updateActiveDate({
                            date: param,
                            state: StateActiveDateElement.weekdays,
                        }),
                    );
                }
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        // clearTimeout(this.timer);
    }

    navigateTo(path, arg) {
        this.router.navigate([path, arg]);
        if (this.media.isActive("sm") || this.media.isActive("xs")) {
            this.configurationService.changeOpenStateLeftSidenavVisibility("close");
        }
    }
}
