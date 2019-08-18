import {Component, OnInit, Input, OnDestroy} from '@angular/core';
import {Task} from '../../../../../../../../libs/data/src/lib/tasks/models/tasks';
import {TaskService} from '../../../../core/services/task.service';
import {UserService} from '../../../../core/services/user.service';
import {User} from '../../../../../../../../libs/data/src/lib/users/models';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {UpdateUser} from '../../../../core/actions/user.actions';
import {Store} from '@ngrx/store';
import {AppStore} from '../../../../store';
import {selectLoggedInUser} from '../../../../core/selectors/user.selectors';


@Component({
    selector: 'tickist-overdue',
    templateUrl: './overdue.component.html',
    styleUrls: ['./overdue.component.scss']
})
export class OverdueComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    @Input() tasks: Task[];
    @Input() defaultTaskView: string;
    taskView: string;
    user: User;

    constructor(private taskService: TaskService, private store: Store<AppStore>) {}

    ngOnInit() {
        this.store.select(selectLoggedInUser).pipe(takeUntil(this.ngUnsubscribe)).subscribe((user) => {
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
            const user = Object.assign({}, this.user, {defaultTaskViewOverdueView: event});
            this.store.dispatch(new UpdateUser({user}));
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
