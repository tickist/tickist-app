import {NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DateAdapter} from '@angular/material/core';
import {BrowserModule} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {StoreModule} from '@ngrx/store';
import {ServiceWorkerModule} from '@angular/service-worker';
import {MyErrorHandler} from './core/services/error-handler.service';
import {FlexLayoutModule} from '@angular/flex-layout';
import {ChartModule, MenuModule, SharedModule, SliderModule, TieredMenuModule} from 'primeng/primeng';
import {AppComponent} from './app.component';
import {UserService} from './core/services/user.service';
import {ProjectService} from './core/services/project.service';
import {TagService} from './core/services/tag.service';
import {ConfigurationService} from './core/services/configuration.service';
import {StatisticsService} from './core/services/statistics.service';
import {TimeDialogComponent} from './single-task/time-dialog/time-dialog.component';
import {ErrorService} from './core/services/error.service';
import {TypeFinishDateString} from './shared/pipes/typeFinishDateString';
import {metaReducers, reducers} from './store';
import {DeleteTaskDialogComponent} from './single-task/delete-task-dialog/delete-task.dialog.component';
import {BlankComponent, RootComponent} from './testing/test.modules';
import {MyDateAdapter} from './shared/data-adapter';
import {environment} from '@env/environment';
import {TasksFiltersService} from './core/services/tasks-filters.service';
import {ProjectsFiltersService} from './modules/left-panel/modules/projects-list/projects-filters.service';
import {TagsFiltersService} from './core/services/tags-filters.service';
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
        StoreModule.forRoot(reducers, {
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
        MenuModule,
        TieredMenuModule,
        SliderModule,
        ChartModule,
        FlexLayoutModule,
        SharedModule,
        ServiceWorkerModule.register('/ngsw-worker.js', {enabled: environment.production}),
        ServiceWorkerModule.register('/firebase-messaging-sw.js'),
        EffectsModule.forRoot([]),
        TickistRoutingModule,
        TickistCoreModule,
        IconsModule,
        AngularFireMessagingModule,
        TickistNotificationsModule,
        TickistLeftPanelModule
        // StoreModule.forFeature('progressBar', fromProgressBar.reducer),
    ],
    bootstrap: [AppComponent],
    entryComponents: [TimeDialogComponent, DeleteTaskDialogComponent, ChangeFinishDateDialogComponent, SnackBarMessageComponent
    ],
    providers: [
        {provide: DateAdapter, useClass: MyDateAdapter},
    ]
})
export class AppModule {


}
