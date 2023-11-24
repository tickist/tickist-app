import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs";
import { Notification } from "@data/notifications";
import { Store } from "@ngrx/store";
import {
    selectAllNotificationsWithOrder,
    selectLengthOfAllNotifications,
    selectLengthOfAllUnreadNotifications,
} from "../../selectors/notifications.selectors";
import { markAllNotificationsAsRead } from "../../actions/notifications.actions";

@Component({
    selector: "tickist-notifications-icon",
    templateUrl: "./notifications-icon.component.html",
    styleUrls: ["./notifications-icon.component.scss"],
})
export class NotificationsIconComponent implements OnInit {
    allNotificationCounter$: Observable<number>;
    allUnreadNotificationCounter$: Observable<number>;
    allNotifications$: Observable<Notification[]>;

    constructor(private store: Store) {}

    ngOnInit() {
        this.allUnreadNotificationCounter$ = this.store.select(selectLengthOfAllUnreadNotifications);
        this.allNotificationCounter$ = this.store.select(selectLengthOfAllNotifications);
        this.allNotifications$ = this.store.select(selectAllNotificationsWithOrder);
    }

    markAllAsRead($event) {
        $event.stopPropagation();
        this.store.dispatch(markAllNotificationsAsRead());
    }
}
