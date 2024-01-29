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
import { MatButtonModule } from "@angular/material/button";
import { FlexModule } from "@ngbracket/ngx-layout/flex";
import { NotificationComponent } from "../notification/notification.component";
import { MatBadgeModule } from "@angular/material/badge";
import { MenuButtonComponent } from "../../../../shared/components/menu-button/menu-button.component";
import { MatMenuModule } from "@angular/material/menu";
import { DataCyDirective } from "../../../../shared/directives/data-cy.directive";
import { NgIf, NgFor, AsyncPipe } from "@angular/common";

@Component({
    selector: "tickist-notifications-icon",
    templateUrl: "./notifications-icon.component.html",
    styleUrls: ["./notifications-icon.component.scss"],
    standalone: true,
    imports: [
        NgIf,
        DataCyDirective,
        MatMenuModule,
        MenuButtonComponent,
        MatBadgeModule,
        NgFor,
        NotificationComponent,
        FlexModule,
        MatButtonModule,
        AsyncPipe,
    ],
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
