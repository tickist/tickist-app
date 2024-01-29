import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {Notification} from '@data/notifications';
import {Store} from '@ngrx/store';
import {updateNotification} from '../../actions/notifications.actions';
import {formatDistanceToNow, isValid} from 'date-fns';
import { DataCyDirective } from '../../../../shared/directives/data-cy.directive';
import { ExtendedModule } from '@ngbracket/ngx-layout/extended';
import { NgStyle, NgIf } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { FlexModule } from '@ngbracket/ngx-layout/flex';


@Component({
    selector: 'tickist-notification',
    templateUrl: './notification.component.html',
    styleUrls: ['./notification.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [FlexModule, FaIconComponent, NgStyle, ExtendedModule, NgIf, DataCyDirective]
})
export class NotificationComponent implements OnInit {
    @Input() notification: Notification;
    ago: string;
    constructor(private store: Store) {
    }

    ngOnInit() {
        if (isValid(this.notification.date))  this.ago = formatDistanceToNow(this.notification.date,{ addSuffix: true })
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
