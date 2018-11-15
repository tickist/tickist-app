import {NgModule, ErrorHandler} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { DateAdapter } from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {StoreModule} from '@ngrx/store';
import { ServiceWorkerModule } from '@angular/service-worker';
import {MyErrorHandler} from './services/errorHandler';
import {FlexLayoutModule} from '@angular/flex-layout';
import {ChartModule, SharedModule} from 'primeng/primeng';
import {AppComponent} from './app.component';
import {UserService} from './services/userService';
import {ProjectService} from './services/project-service';
import {HomeComponent} from './home';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {TaskService} from './services/task-service';
import {LoginComponent} from './login/login.component';
import {SignupComponent} from './signup/signup.component';
import {ForgotPasswordComponent} from './forgot-password/forgot-password.component';
import {TagService} from './services/tag-service';
import {NavComponent} from './nav-component/nav.component';
import {TagsComponent} from './tags-component/tags.component';
import {TaskComponent} from './task-component/task.component';
import {ProjectComponent} from './project-component/project.component';
import {TasksListComponent} from './tasks-list/tasks-list.component';
import {UserComponent} from './user/user.component';
import {TeamComponent} from './team/team.component';
import {
    FilterTasksComponent, TasksFilterDialog, AssignedToDialog,
} from './filter-tasks/filter-tasks.component';
import {MenuModule, TieredMenuModule, SliderModule} from 'primeng/primeng';
import {ConfigurationService} from './services/configurationService';
import {StatisticsService} from './services/statisticsService';
import {NavBarLandingPageComponent} from './nav-bar-landing-page/nav-bar-landing-page.component';
import {SortablejsModule} from 'angular-sortablejs';
import {TagComponent} from './tag/tag.component';
import {AddTaskComponent} from './add-task/add-task.component';
import {SingleProjectComponent} from './single-project/single-project.component';
import {CalendarModule} from 'primeng/components/calendar/calendar';
import {ColorPickerComponent} from './project-component/color-picker/color-picker.component';
import {TimeDialogComponent} from './single-task/time-dialog/time-dialog.component';
import {ErrorService} from './services/errorService';
import {RepeatString} from './shared/pipes/repeatString';
import {RepeatStringExtension} from './shared/pipes/repeatStringExtension';
import {TypeFinishDateString} from './shared/pipes/typeFinishDateString';
import {reducers} from './store';
import {DeleteTaskDialogComponent} from './single-task/delete-task-dialog/delete-task.dialog.component';
import {BlankComponent, RootComponent} from './testing/test.modules';
import {TasksFromProjectsComponent} from './tasks-from-projects/tasks-from-projects.component';
import {ProjectsListComponent} from './projects-list/projects-list.component';
import {TagsListComponent} from './tags-list/tags-list.component';
import {MyDateAdapter} from './shared/data-adapter';
import {environment} from '../environments/environment';
import {AutofocusDirective} from './shared/autofocus';
import {JwtModule} from '@auth0/angular-jwt';
import {HttpClientModule, HTTP_INTERCEPTORS} from '@angular/common/http';
import {RequestInterceptorService} from './httpInterceptor';
import {DeleteProjectConfirmationDialogComponent} from './project-component/delete-project-dialog/delete-project-dialog.component';
import { ShowApiErrorComponent } from './show-api-error/show-api-error.component';
import { ShowOfflineModeComponent } from './show-offline-mode/show-offline-mode.component';
import { ShowNotificationAboutNewDayComponent } from './show-notification-about-new-day/show-notification-about-new-day.component';
import {FilterProjectDialogComponent} from './projects-list/filter-projects-dialog/filter-projects.dialog.component';
import {SortTasksComponent} from './sort-tasks/sort-tasks.component';
import {SortByDialogComponent} from './sort-tasks/sort-tasks-dialog/sort-tasks.dialog.component';
import {TasksFiltersService} from './services/tasks-filters.service';
import {ProjectsFiltersService} from './services/projects-filters.service';
import { FilterTagsDialogComponent } from './tags-list/filter-tags-dialog/filter-tags-dialog.component';
import {TagsFiltersService} from './services/tags-filters-service';
import {TickistMaterialModule} from './material.module';
import {ChangeFinishDateDialogComponent} from './single-task/change-finish-date-dialog/change-finish-date-dialog.component';
import {TagsFilterDialog} from './filter-tasks/tags-filter-dialog/tags-filter-dialog.component';
import {EstimateTimeDialog} from './filter-tasks/estimate-time-dialog/estimate-time-dialog.component';
import {TickistRoutingModule} from './routing/routing.module';
import {TickistDashboardModule} from './dashboard/dashboard.module';
import {TickistSharedModule} from './shared/shared.module';
import {TickistSingleTaskModule} from './single-task/single-task.module';
import {TickistStatisticsModule} from './statistics/statistics.module';
import { SearchAutocompleteComponent } from './search-autocomplete/search-autocomplete.component';

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
        TagsComponent,
        TaskComponent,
        ProjectComponent,
        TasksListComponent,
        UserComponent,
        TeamComponent,
        FilterTasksComponent,
        NavBarLandingPageComponent,
        ColorPickerComponent,
        TagComponent,
        AddTaskComponent,
        SingleProjectComponent,
        TasksFilterDialog,
        AssignedToDialog,
        TagsFilterDialog,
        SortByDialogComponent,
        EstimateTimeDialog,
        DeleteTaskDialogComponent,
        DeleteProjectConfirmationDialogComponent,
        TimeDialogComponent,
        ShowApiErrorComponent,
        RepeatString,
        RepeatStringExtension,
        TypeFinishDateString,
        AutofocusDirective,
        BlankComponent,
        RootComponent,
        TasksFromProjectsComponent,
        ProjectsListComponent,
        TagsListComponent,
        ShowOfflineModeComponent,
        ShowNotificationAboutNewDayComponent,
        ShowApiErrorComponent,
        FilterProjectDialogComponent,
        SortTasksComponent,
        FilterTagsDialogComponent,
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
        StoreModule.forRoot(reducers, {
            initialState: {}
        }),
        !environment.production ? StoreDevtoolsModule.instrument({maxAge: 50}) : [],
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
        TickistRoutingModule
    ],
    bootstrap: [AppComponent],
    entryComponents: [TasksFilterDialog, AssignedToDialog, TagsFilterDialog, SortByDialogComponent, EstimateTimeDialog,
        DeleteProjectConfirmationDialogComponent, TimeDialogComponent, DeleteTaskDialogComponent,
        FilterProjectDialogComponent, FilterTagsDialogComponent, ChangeFinishDateDialogComponent
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
