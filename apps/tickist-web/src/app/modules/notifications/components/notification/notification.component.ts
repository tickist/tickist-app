import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {Notification} from '@data/notifications';
import {Store} from '@ngrx/store';
import {updateNotification} from '../../actions/notifications.actions';

@Component({
    selector: 'tickist-notification',
    templateUrl: './notification.component.html',
    styleUrls: ['./notification.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationComponent implements OnInit {
    @Input() notification: Notification;

    constructor(private store: Store<{}>) {
    }

    ngOnInit() {
    }

    markAs() {
        this.store.dispatch(updateNotification({
                notification: {
                    id: this.notification.id,
                    changes: {
                        ...this.notification,
                        isRead: !this.notification.isRead
                    }
                }
            })
        );
    }

}
