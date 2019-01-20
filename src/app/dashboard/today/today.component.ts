import {Component, OnInit, Input, OnDestroy} from '@angular/core';
import {Task} from '../../models/tasks';
import {ConfigurationService} from '../../services/configuration.service';
import {UserService} from '../../user/user.service';
import {User} from '../../user/models';
import {IActiveDateElement} from '../../models/active-data-element.interface';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {Store} from '@ngrx/store';
import {AppStore} from '../../store';
import {selectLoggedInUser} from '../../user/user.selectors';
import {UpdateUser} from '../../user/user.actions';

@Component({
    selector: 'tickist-today',
    templateUrl: './today.component.html',
    styleUrls: ['./today.component.scss']
})
export class TodayComponent implements OnInit, OnDestroy {
    @Input() tasks: Task[];
    @Input() defaultTaskView: string;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    taskView: string;
    activeDateElement: IActiveDateElement;
    user: User;

    constructor(protected configurationService: ConfigurationService, private store: Store<AppStore>) {
    }

    ngOnInit() {
        this.configurationService.activeDateElement$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
                (activeDateElement) => {
                    this.activeDateElement = activeDateElement;
                });
        this.store.select(selectLoggedInUser).pipe(takeUntil(this.ngUnsubscribe)).subscribe((user) => {
            if (user) {
                this.user = user;
            }
        });
    }

    changeTaskView(event) {
        this.taskView = event;
        if (this.user.defaultTaskViewTodayView !== event) {
            this.user.defaultTaskViewTodayView = event;
            this.store.dispatch(new UpdateUser({user: this.user}));
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
