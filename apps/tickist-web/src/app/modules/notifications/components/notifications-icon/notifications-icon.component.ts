import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {Notification} from '@data/notifications';
import {Store} from '@ngrx/store';
import {selectAllNotifications, selectLengthOfAllUnreadNotifications} from '../../selectors/notifications.selectors';

@Component({
    selector: 'tickist-notifications-icon',
    templateUrl: './notifications-icon.component.html',
    styleUrls: ['./notifications-icon.component.scss']
})
export class NotificationsIconComponent implements OnInit {
    allNotificationCounter$: Observable<number>;
    allNotifications$: Observable<Notification[]>;

    constructor(private store: Store<{}>) {
    }

    ngOnInit() {
        this.allNotificationCounter$ = this.store.select(selectLengthOfAllUnreadNotifications);
        this.allNotifications$ = this.store.select(selectAllNotifications)
    }

}
