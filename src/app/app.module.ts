import {NgModule, ErrorHandler} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { DateAdapter } from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {StoreModule} from '@ngrx/store';
import { ServiceWorkerModule } from '@angular/service-worker';
import {MyErrorHandler} from './services/error-handler.service';
import {FlexLayoutModule} from '@angular/flex-layout';
import {ChartModule, SharedModule} from 'primeng/primeng';
import {AppComponent} from './app.component';
import {UserService} from './services/user.service';
import {ProjectService} from './services/project.service';
import {HomeComponent} from './home';
import {TaskService} from './services/task.service';
import {LoginComponent} from './login';
import {SignupComponent} from './signup/signup.component';
import {ForgotPasswordComponent} from './forgot-password';
import {TagService} from './services/tag.service';
import {NavComponent} from './nav-component/nav.component';
import {TaskComponent} from './task-component/task.component';
import {TasksListComponent} from './tasks-list/tasks-list.component';
import {UserComponent} from './user/user.component';
import {TeamComponent} from './team/team.component';
import {MenuModule, TieredMenuModule, SliderModule} from 'primeng/primeng';
import {ConfigurationService} from './services/configuration.service';
import {StatisticsService} from './services/statistics.service';
import {NavBarLandingPageComponent} from './nav-bar-landing-page/nav-bar-landing-page.component';
import {SortablejsModule} from 'angular-sortablejs';
import {AddTaskComponent} from './add-task/add-task.component';
import {CalendarModule} from 'primeng/components/calendar/calendar';
import {TimeDialogComponent} from './single-task/time-dialog/time-dialog.component';
import {ErrorService} from './services/error.service';
import {TypeFinishDateString} from './shared/pipes/typeFinishDateString';
import {reducers} from './store';
import {DeleteTaskDialogComponent} from './single-task/delete-task-dialog/delete-task.dialog.component';
import {BlankComponent, RootComponent} from './testing/test.modules';
import {MyDateAdapter} from './shared/data-adapter';
import {environment} from '../environments/environment';
import {AutofocusDirective} from './shared/autofocus';
import {JwtModule} from '@auth0/angular-jwt';
import {HttpClientModule, HTTP_INTERCEPTORS} from '@angular/common/http';
import {RequestInterceptorService} from './httpInterceptor';
import { ShowApiErrorComponent } from './show-api-error/show-api-error.component';
import { ShowOfflineModeComponent } from './show-offline-mode/show-offline-mode.component';
import { ShowNotificationAboutNewDayComponent } from './show-notification-about-new-day/show-notification-about-new-day.component';
import {TasksFiltersService} from './services/tasks-filters.service';
import {ProjectsFiltersService} from './services/projects-filters.service';
import {TagsFiltersService} from './services/tags-filters.service';
import {TickistMaterialModule} from './material.module';
import {ChangeFinishDateDialogComponent} from './single-task/change-finish-date-dialog/change-finish-date-dialog.component';
import {TickistRoutingModule} from './routing/routing.module';
import {TickistDashboardModule} from './dashboard/dashboard.module';
import {TickistSharedModule} from './shared/shared.module';
import {TickistSingleTaskModule} from './single-task/single-task.module';
import {TickistStatisticsModule} from './statistics/statistics.module';
import { SearchAutocompleteComponent } from './search-autocomplete/search-autocomplete.component';
import {TickistTagsModule} from './tags/tags.module';
import {TickistProjectsModule} from './projects/projects.module';
import {HttpClientInMemoryWebApiModule} from 'angular-in-memory-web-api';
import {InMemoryDataService} from './testing/mocks/inMemryDb';

export function tokenGetter() {
    return localStorage.getItem('JWT');
}


@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        LoginComponent,
        SignupComponent,
        ForgotPasswordComponent,
        NavComponent,
        TaskComponent,
        TasksListComponent,
        UserComponent,
        TeamComponent,
        NavBarLandingPageComponent,
        AddTaskComponent,
        DeleteTaskDialogComponent,
        TimeDialogComponent,
        ShowApiErrorComponent,
        TypeFinishDateString,
        AutofocusDirective,
        BlankComponent,
        RootComponent,
        ShowOfflineModeComponent,
        ShowNotificationAboutNewDayComponent,
        ShowApiErrorComponent,
        ChangeFinishDateDialogComponent,
        SearchAutocompleteComponent
    ],
    imports: [
        TickistDashboardModule,
        TickistSharedModule,
        TickistSingleTaskModule,
        TickistStatisticsModule,
        BrowserModule,
        BrowserAnimationsModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        HttpClientInMemoryWebApiModule.forRoot(InMemoryDataService, { delay: 100 }),
        environment.e2eTest ?
            HttpClientInMemoryWebApiModule.forRoot(InMemoryDataService, { delay: 100 }) : [],
        StoreModule.forRoot(reducers, {
            initialState: {}
        }),
        // environment.production ? StoreDevtoolsModule.instrument({maxAge: 50}) : [],
        SortablejsModule,
        TickistMaterialModule,
        MenuModule,
        TieredMenuModule,
        SliderModule,
        CalendarModule,
        ChartModule,
        FlexLayoutModule,
        SharedModule,
        JwtModule.forRoot({
            config: {
                headerName: 'Authorization',
                authScheme: '',
                whitelistedDomains: ['localhost:4200', 'tickist.com', 'app.tickist.com', 'localhost:8000'],
                tokenGetter: tokenGetter
            }
        }),
        ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production }),
        TickistRoutingModule,
        TickistTagsModule,
        TickistProjectsModule
    ],
    bootstrap: [AppComponent],
    entryComponents: [TimeDialogComponent, DeleteTaskDialogComponent, ChangeFinishDateDialogComponent
    ],
    providers: [
        {provide: LocationStrategy, useClass: HashLocationStrategy},
        {provide: DateAdapter, useClass: MyDateAdapter},
        UserService,
        TaskService,
        TasksFiltersService,
        ProjectsFiltersService,
        ProjectService,
        TagService,
        TagsFiltersService,
        ConfigurationService,
        StatisticsService,
        MyErrorHandler,
        ErrorService,
        {provide: HTTP_INTERCEPTORS, useClass: RequestInterceptorService, multi: true},
        {
            provide: ErrorHandler,
            useClass: MyErrorHandler
        }
    ]
})
export class AppModule {


}
