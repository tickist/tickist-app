import { Component, OnDestroy } from "@angular/core";
import { Store } from "@ngrx/store";
import { Subject } from "rxjs";
import { removeNotificationPermission } from "../../../../core/actions/user.actions";
import { NotificationsService } from "../../services/notifications.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatButtonModule } from "@angular/material/button";
import { FlexModule } from "@ngbracket/ngx-layout/flex";

@Component({
    selector: "tickist-snack-bar-notification",
    templateUrl: "./snack-bar-notification.component.html",
    styleUrls: ["./snack-bar-notification.component.css"],
    standalone: true,
    imports: [FlexModule, MatButtonModule],
})
export class SnackBarNotificationComponent implements OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        public snackBar: MatSnackBar,
        private store: Store,
        private notificationsService: NotificationsService
    ) {}

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    sendYes() {
        this.notificationsService.createFcmToken();
        this.snackBar.dismiss();
    }

    sendNo() {
        this.store.dispatch(removeNotificationPermission());
        this.snackBar.dismiss();
    }
}
