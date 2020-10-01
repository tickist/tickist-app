import {NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DateAdapter} from '@angular/material/core';
import { BrowserModule } from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ActionReducerMap, StoreModule} from '@ngrx/store';
import {ServiceWorkerModule} from '@angular/service-worker';
import {FlexLayoutModule} from '@angular/flex-layout';
import {AppComponent} from './app.component';
import {TimeDialogComponent} from './single-task/time-dialog/time-dialog.component';
import {TypeFinishDateString} from './shared/pipes/typeFinishDateString';
import {metaReducers} from './store';
import {DeleteTaskDialogComponent} from './single-task/delete-task-dialog/delete-task.dialog.component';
import {RootComponent} from './testing/test.modules';
import {MyDateAdapter} from './shared/data-adapter';
import {environment} from '@env/environment';
import {TickistMaterialModule} from './material.module';
import {ChangeFinishDateDialogComponent} from './single-task/change-finish-date-dialog/change-finish-date-dialog.component';
import {TickistRoutingModule} from './routing.module';
import {TickistSharedModule} from './shared/shared.module';
import {TickistSingleTaskModule} from './single-task/single-task.module';
import {EffectsModule} from '@ngrx/effects';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {TickistCoreModule} from './core/core.module';
import {SortablejsModule} from 'ngx-sortablejs';
import {AngularFireModule} from '@angular/fire';
import {SnackBarMessageComponent} from './components/snack-bar-message/snack-bar-message.component';
import {IconsModule} from './icons.module';
import {AngularFireMessagingModule} from '@angular/fire/messaging';
import {TickistNotificationsModule} from './modules/notifications/notifications.module';
import {TickistLeftPanelModule} from './modules/left-panel/left-panel.module';
import {AngularFirestoreModule, SETTINGS} from "@angular/fire/firestore";
import {reducer as addTaskComponentVisibilityReducer} from "./reducers/add-task-component-visibility";
import {reducer as leftSidenavVisibility} from "./reducers/left-sidenav-visibility";


@NgModule({
    declarations: [
        AppComponent,
        DeleteTaskDialogComponent,
        TimeDialogComponent,
        TypeFinishDateString,
        ChangeFinishDateDialogComponent,
        RootComponent,
        SnackBarMessageComponent
    ],
    imports: [
        TickistSharedModule,
        TickistSingleTaskModule,
        BrowserModule,
        BrowserAnimationsModule,
        AngularFireModule.initializeApp(environment.firebase),
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        StoreModule.forRoot({
            'addTaskComponentVisibilityReducer': addTaskComponentVisibilityReducer,
            'leftSidenavVisibility': leftSidenavVisibility
        } as ActionReducerMap<any>, {
            initialState: {},
            metaReducers, runtimeChecks: {strictStateImmutability: true, strictActionImmutability: true}
        }),
        StoreDevtoolsModule.instrument({
            maxAge: 25, // Retains last 25 states
            logOnly: environment.production, // Restrict extension to log-only mode
        }),
        environment.production ? StoreDevtoolsModule.instrument({maxAge: 50}) : [],
        SortablejsModule.forRoot({
            animation: 150
        }),
        TickistMaterialModule,
        FlexLayoutModule,
        ServiceWorkerModule.register('/combined-sw.js', {
            registrationStrategy: 'registerImmediately',
            enabled: environment.production
        }),
        ServiceWorkerModule.register('/firebase-messaging-sw.js', {
            registrationStrategy: 'registerImmediately',
            enabled: !environment.production
        }),
        EffectsModule.forRoot([]),
        TickistRoutingModule,
        TickistCoreModule,
        IconsModule,
        AngularFireMessagingModule,
        TickistNotificationsModule,
        TickistLeftPanelModule,
        AngularFirestoreModule,
    ],
    bootstrap: [AppComponent],
    providers: [
        {provide: DateAdapter, useClass: MyDateAdapter},
        {
            provide: SETTINGS,
            useValue: environment.emulator ?  {
                host: environment.emulatorIPAddress,
                ssl: false,
                experimentalForceLongPolling: true
            } : undefined
        }
    ]
})
export class AppModule {


}
