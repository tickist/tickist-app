import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { Task } from "@data/tasks/models/tasks";
import { User } from "@data/users/models";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { Store } from "@ngrx/store";
import { AppStore } from "../../../../store";
import { selectLoggedInUser } from "../../../../core/selectors/user.selectors";
import { updateUser } from "../../../../core/actions/user.actions";
import { selectActiveDate } from "../../../../core/selectors/active-date.selectors";
import { IActiveDateElement } from "@data/active-data-element.interface";

@Component({
    selector: "tickist-today",
    templateUrl: "./today.component.html",
    styleUrls: ["./today.component.scss"],
})
export class TodayComponent implements OnInit, OnDestroy {
    @Input() tasks: Task[];
    @Input() defaultTaskView: string;

    taskView: string;
    activeDateElement: IActiveDateElement;
    user: User;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    constructor(private store: Store) {}

    ngOnInit() {
        this.store
            .select(selectActiveDate)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((activeDateElement) => {
                this.activeDateElement = activeDateElement;
            });
        this.store
            .select(selectLoggedInUser)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((user) => {
                if (user) {
                    this.user = user;
                }
            });
    }

    changeTaskView(event) {
        this.taskView = event;
        if (this.user.defaultTaskViewTodayView !== event) {
            const user = Object.assign({}, this.user, { defaultTaskViewTodayView: event });
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
