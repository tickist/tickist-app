import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {Notification} from '@data/notifications';

@Component({
    selector: 'tickist-notification',
    templateUrl: './notification.component.html',
    styleUrls: ['./notification.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationComponent implements OnInit {
    @Input() notification: Notification;
    constructor() {
    }

    ngOnInit() {
    }

}
