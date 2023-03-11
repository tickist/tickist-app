import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { FutureListElement } from "./models";
import { ActivatedRoute, Router } from "@angular/router";
import { MediaObserver } from "@ngbracket/ngx-layout";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { TaskService } from "../../../../core/services/task.service";
import { Task } from "@data/tasks/models/tasks";
import { UserService } from "../../../../core/services/user.service";
import { User } from "@data/users/models";
import { StateActiveDateElement } from "@data/state-active-date-element.enum";
import { futureTasksRoutesName } from "../../../future-tasks/routes.names";
import { selectActiveDate } from "../../../../core/selectors/active-date.selectors";
import { Store } from "@ngrx/store";
import { AppStore } from "../../../../store";
import { IActiveDateElement } from "@data/active-data-element.interface";
import { addMonths, format, getMonth, getYear } from "date-fns";

@Component({
    selector: "tickist-future-list",
    templateUrl: "./future-list.component.html",
    styleUrls: ["./future-list.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FutureListComponent implements OnInit, OnDestroy {
    futureList: FutureListElement[];
    monthsRequired = 12;
    activeDateElement: IActiveDateElement;
    tasks: Task[];
    user: User;
    stateActiveDateElement = StateActiveDateElement;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private store: Store,
        private media: MediaObserver,
        private taskService: TaskService,
        private userService: UserService,
        private cd: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.store
            .select(selectActiveDate)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((activeDateElement: IActiveDateElement) => {
                this.activeDateElement = activeDateElement;
                this.cd.detectChanges();
            });
        // @TODO we need only tasks with finishDate
        this.taskService.tasks$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((tasks: Task[]) => {
            this.tasks = tasks;
            this.futureList = this.createFutureList();
            this.cd.detectChanges();
        });
        this.userService.user$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((user: User) => {
            this.user = user;
            this.futureList = this.createFutureList();
            this.cd.detectChanges();
        });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    private createFutureList(): FutureListElement[] {
        if (!this.tasks.length || !this.user) return [];
        const futureList = [];
        for (let i = 0; i <= this.monthsRequired; i++) {
            const momentDate = addMonths(new Date(), i);
            futureList.push({
                url: format(momentDate, "MMMM-yyyy"),
                label: format(momentDate, "MMMM yyyy"),
                tasksCounter: this.tasks.filter(
                    (task) =>
                        task.owner.id === this.user.id &&
                        task.isDone === false &&
                        task.finishDate &&
                        getMonth(task.finishDate) === getMonth(momentDate) &&
                        getYear(task.finishDate) === getYear(momentDate)
                ).length,
            });
        }

        return futureList;
    }

    isSelected(elem: FutureListElement) {
        return (
            this.activeDateElement.state === this.stateActiveDateElement.future &&
            elem.url === format(this.activeDateElement.date, "MMMM-yyyy")
        );
    }

    navigateTo(path, arg) {
        // @TODO please fix it
        this.router.navigate(["home", futureTasksRoutesName.futureTasks, arg]);
        if (this.media.isActive("sm") || this.media.isActive("xs")) {
            // @TODO add action
            // this.contentfigurationService.changeOpenStateLeftSidenavVisibility('close');
        }
    }
}
