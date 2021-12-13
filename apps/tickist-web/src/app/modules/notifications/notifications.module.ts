import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { TickistMaterialModule } from "../../material.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TickistSharedModule } from "../../shared/shared.module";
import { NotificationsIconComponent } from "./components/notifications-icon/notifications-icon.component";
import { IconsModule } from "../../icons.module";
import { StoreModule } from "@ngrx/store";
import { notificationsFeatureKey, reducer as notificationReducer } from "./reducers/notifications.reducer";
import { EffectsModule } from "@ngrx/effects";
import { NotificationsEffects } from "./effects/notifications.effects";
import { NotificationComponent } from "./components/notification/notification.component";
import { SnackBarNotificationComponent } from "./components/snack-bar-notification/snack-bar-notification.component";

@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FormsModule,
        FlexLayoutModule,
        EffectsModule.forFeature([NotificationsEffects]),
        ReactiveFormsModule,
        TickistSharedModule,
        IconsModule,
        StoreModule.forFeature(notificationsFeatureKey, notificationReducer),
    ],
    providers: [],
    exports: [NotificationsIconComponent, SnackBarNotificationComponent],
    declarations: [NotificationsIconComponent, NotificationComponent, SnackBarNotificationComponent],
})
export class TickistNotificationsModule {}
