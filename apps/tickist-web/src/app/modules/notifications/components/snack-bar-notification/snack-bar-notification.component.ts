import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {AngularFireMessaging} from '@angular/fire/messaging';
import {map, mergeMapTo, takeUntil, withLatestFrom} from 'rxjs/operators';
import {UserService} from '../../../../core/services/user.service';
import {Subject} from 'rxjs';
import {selectLoggedInUser} from '../../../../core/selectors/user.selectors';
import {removeNotificationPermission, savefcmToken} from '../../../../core/actions/user.actions';
import {NotificationsService} from '../../services/notifications.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
    selector: 'tickist-snack-bar-notification',
    templateUrl: './snack-bar-notification.component.html',
    styleUrls: ['./snack-bar-notification.component.css']
})
export class SnackBarNotificationComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public snackBar: MatSnackBar, private store: Store, private notificationsService: NotificationsService) {
    }

    ngOnInit(): void {
    }

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
