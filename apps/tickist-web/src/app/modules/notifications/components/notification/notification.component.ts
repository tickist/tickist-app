import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {Notification} from '@data/notifications';
import {Store} from '@ngrx/store';
import {updateNotification} from '../../actions/notifications.actions';
import {formatDistanceToNow} from 'date-fns';


@Component({
    selector: 'tickist-notification',
    templateUrl: './notification.component.html',
    styleUrls: ['./notification.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationComponent implements OnInit {
    @Input() notification: Notification;
    ago: any;
    constructor(private store: Store<{}>) {
    }

    ngOnInit() {
        this.ago = formatDistanceToNow(this.notification.date,{ addSuffix: true })
    }

    markAs($event) {
        $event.stopPropagation();
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
