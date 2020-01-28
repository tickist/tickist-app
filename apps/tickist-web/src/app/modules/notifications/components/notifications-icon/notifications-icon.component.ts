import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {Store} from '@ngrx/store';
import {selectLenghtOfAllUnreadNotifications} from '../../selectors/notifications.selectors';

@Component({
    selector: 'tickist-notifications-icon',
    templateUrl: './notifications-icon.component.html',
    styleUrls: ['./notifications-icon.component.scss']
})
export class NotificationsIconComponent implements OnInit {
    allNotificationCounter$: Observable<number>;

    constructor(private store: Store<{}>) {
    }

    ngOnInit() {
        this.allNotificationCounter$ = this.store.select(selectLenghtOfAllUnreadNotifications);
    }

}
