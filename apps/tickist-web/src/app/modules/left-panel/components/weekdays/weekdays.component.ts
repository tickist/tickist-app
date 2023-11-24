import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { ConfigurationService } from "../../../../core/services/configuration.service";
import { Task } from "@data/tasks/models/tasks";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject } from "rxjs";
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as _ from "lodash";
import { MediaObserver } from "@ngbracket/ngx-layout";
import { TaskService } from "../../../../core/services/task.service";
import { UserService } from "../../../../core/services/user.service";
import { User } from "@data/users/models";
import { takeUntil } from "rxjs/operators";
import { Store } from "@ngrx/store";
import { selectAllUndoneTasks } from "../../../../core/selectors/task.selectors";
import { selectActiveDate } from "../../../../core/selectors/active-date.selectors";
import { homeRoutesName } from "../../../../routing.module.name";
import { IActiveDateElement } from "@data/active-data-element.interface";
import { addDays, format, isDate } from "date-fns";
import { weekdaysRoutesName } from "../../../weekdays/routes.names";

@Component({
    selector: "tickist-weekdays-list",
    templateUrl: "./weekdays.component.html",
    styleUrls: ["./weekdays.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekDaysComponent implements OnInit, OnDestroy {
    activeDateElement: IActiveDateElement;
    today: Date;
    tasks: Task[] = [];
    week: Array<any> = [];
    user: User;
    timer: any;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private route: ActivatedRoute,
        private cd: ChangeDetectorRef,
        private taskService: TaskService,
        private configurationService: ConfigurationService,
        private router: Router,
        private store: Store,
        private userService: UserService,
        private media: MediaObserver,
    ) {
        this.regenerateWeekListAfterMidnight();
    }

    regenerateWeekListAfterMidnight() {}

    isToday(date: Date | string = this.activeDateElement.date): boolean {
        const today: Date = new Date();
        if (isDate(date)) {
            date = <string>format(<Date>date, "dd-MM-yyyy");
        }
        return format(today, "dd-MM-yyyy") === date;
    }

    ngOnInit(): void {
        // @TODO check if it is necessary
        // this.route.params
        //     .pipe(
        //         takeUntil(this.ngUnsubscribe),
        //         map(params => params['date'])
        //     )
        //     .subscribe((param) => {
        //         this.store.dispatch(new UpdateActiveDate({date: param, state: stateActiveDateElement.weekdays}));
        //     });
        this.store
            .select(selectActiveDate)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((activeDateElement) => {
                this.activeDateElement = activeDateElement;
                this.cd.detectChanges();
            });
        this.store
            .select(selectAllUndoneTasks)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((tasks) => {
                this.tasks = tasks;
                this.feelWeekData();
                this.cd.detectChanges();
            });

        this.userService.user$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((user) => {
            this.user = user;
            this.feelWeekData();
            this.cd.detectChanges();
        });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        this.cd.detach();
        // clearTimeout(this.timer);
    }

    isSelected(day): boolean {
        return day.date === format(this.activeDateElement.date, "dd-MM-yyyy");
    }

    navigateTo(arg) {
        this.router.navigate([`${homeRoutesName.home}`, `${weekdaysRoutesName.weekdays}`, arg]);
        if (this.media.isActive("sm") || this.media.isActive("xs")) {
            this.configurationService.changeOpenStateLeftSidenavVisibility("close");
        }
    }

    chooseDay(date) {
        this.navigateTo(date);
    }

    feelWeekData() {
        let nextDay = new Date();
        const userId = _.get(this.user, "id");
        this.week = [];
        if (!userId || this.tasks.length === 0) {
            return;
        }
        for (let i = 0; i < 7; i++) {
            this.week.push({
                name: format(nextDay, "EEEE"),
                date: format(nextDay, "dd-MM-yyyy"),
                tasksCounter: this.tasks
                    .filter((task) => task.owner.id === userId && task.isDone === false)
                    .filter((task) => {
                        const finishDate = task.finishDate;
                        return (
                            (finishDate && format(finishDate, "dd-MM-yyyy") === format(nextDay, "dd-MM-yyyy")) ||
                            (this.isToday(nextDay) && task.pinned)
                        );
                    }).length,
            });
            nextDay = addDays(nextDay, 1);
        }
    }
}
