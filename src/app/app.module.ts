import {NgModule, ErrorHandler} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
    MatButtonModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatCardModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MAT_DATE_LOCALE,
    DateAdapter,
    NativeDateAdapter
} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {StoreModule} from '@ngrx/store';
import { ServiceWorkerModule } from '@angular/service-worker';
// HANDLERS
import {MyErrorHandler} from './services/errorHandler';
import {FlexLayoutModule} from '@angular/flex-layout';
import {ChartModule, SharedModule} from 'primeng/primeng';
import {AppComponent} from './app.component';
import {UserService} from './services/userService';
import {ProjectService} from './services/project-service';
import {LoggedInGuard} from './guards/loggedIn.guard';
import {AnonymousGuard} from './guards/anonymous.guard';
import {
    ProjectsResolver,
    routes, SetAllTagsFilterResolver,
    SetAllTasksFilterResolver,
    TagsResolver,
    TasksResolver,
    TeamResolver,
    UserResolver
} from './app.routes';
import {HomeComponent} from './home/home.component';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {useLogMonitor} from '@ngrx/store-log-monitor';
import {TaskService} from './services/task-service';
import {LoginComponent} from './login/login.component';
import {SignupComponent} from './signup/signup.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {ForgotPasswordComponent} from './forgot-password/forgot-password.component';

import {TagService} from './services/tag-service';
import {NavComponent} from './nav-component/nav.component';
import {TagsComponent} from './tags-component/tags.component';
import {TaskComponent} from './task-component/task.component';
import {ProjectComponent} from './project-component/project.component';
import {TasksListComponent} from './tasks-list/tasks-list.component';
import {TodayComponent} from './dashboard/today/today.component';
import {OverdueComponent} from './dashboard/overdue/overdue.component';
import {FutureComponent} from './dashboard/future/future.component';
import {UserComponent} from './user/user.component';
import {TeamComponent} from './team/team.component';
import {SingleTaskComponent, SingleTaskSimplifiedComponent} from './single-task/single-task.component';
import {
    FilterTasksComponent, TasksFilterDialog, AssignedToDialog,
    EstimateTimeDialog, TagsFilterDialog
} from './filter-tasks/filter-tasks.component';
import {MenuModule, TieredMenuModule, SliderModule} from 'primeng/primeng';
import {ConfigurationService} from './services/configurationService';
import {StatisticsService} from './services/statisticsService';
import {NavBarLandingPageComponent} from './nav-bar-landing-page/nav-bar-landing-page.component';
import {TaskNameComponent} from './single-task/task-name/task-name.component';
import {DayStatisticsComponent} from './day-statistics/day-statistics.component';
import {GlobalStatisticsComponent} from './global-statistics/global-statistics.component';
import {DateToString} from './pipes/datetostring';
import {Minutes2hoursPipe} from './pipes/minutes2hours';
import {TruncatePipe} from './pipes/truncate.pipe';
import {SortablejsModule} from 'angular-sortablejs';
import {TagComponent} from './tag/tag.component';
import {AddTaskComponent} from './add-task/add-task.component';
import {SingleProjectComponent} from './single-project/single-project.component';
import {AvatarSize} from './pipes/avatarSize';
import {CalendarModule} from 'primeng/components/calendar/calendar';
import {ColorPickerComponent} from './project-component/color-picker/color-picker.component';
import {TimeDialogComponent} from './single-task/time-dialog/time-dialog.component';
import {ChangeTaskViewComponent} from './shared/change-task-view-component/change-task-view.component';
import {ErrorService} from './services/errorService';
import {RepeatString} from './pipes/repeatString';
import {RepeatStringExtension} from './pipes/repeatStringExtension';
import {TypeFinishDateString} from './pipes/typeFinishDateString';
import {reducers} from './store';
import {ChartsModule} from 'ng2-charts/ng2-charts';
import {EditRepeatingOptionComponent} from './edit-repeating-options/edit-repeating-option.component';
import {DateOptionsComponent} from './date-options/date-options.component';
import {DeleteTaskDialogComponent} from './single-task/delete-task-dialog/delete-task.dialog.component';
import {BlankComponent, RootComponent} from './testing/test.modules';
import {TasksFromProjectsComponent} from './tasks-from-projects/tasks-from-projects.component';
import {ProjectsListComponent} from './projects-list/projects-list.component';
import {WeekDaysComponent} from './dashboard/weekdays/weekdays.component';
import {TagsListComponent} from './tags-list/tags-list.component';
import {MenuButtonComponent} from './shared/menu-button/menu-button.component';
import {DisplayFinishDateComponent} from './single-task/display-finish-date/display-finish-date.component';
import {ToggleButtonComponent} from './single-task/toggle-button/toggle-button.component';
import {UserAvatarComponent} from './user-avatar/user-avatar.component';
import {ProgressBarComponent} from './single-task/progress-bar/progress-bar.component';
import {PinButtonComponent} from './single-task/pin-button/pin-button.component';
import {RightMenuComponent} from './single-task/right-menu/right-menu.component';
import {MyDateAdapter} from './shared/data-adapter';
import {environment} from '../environments/environment';
import {AutofocusDirective} from './shared/autofocus';
import {JwtModule} from '@auth0/angular-jwt';
import {HttpClientModule, HTTP_INTERCEPTORS} from '@angular/common/http';
import {ChooseDayComponent} from './dashboard/choose-day/choose-day.component';
import {RequestInterceptorService} from './httpInterceptor';
import {DeleteProjectConfirmationDialogComponent} from './project-component/delete-project-dialog/delete-project-dialog.component';
import { ShowApiErrorComponent } from './show-api-error/show-api-error.component';
import { ShowOfflineModeComponent } from './show-offline-mode/show-offline-mode.component';
import { ShowNotificationAboutNewDayComponent } from './show-notification-about-new-day/show-notification-about-new-day.component';
import {FilterProjectDialogComponent} from './projects-list/filter-projects-dialog/filter-projects.dialog.component';
import {SortTasksComponent} from './sort-tasks/sort-tasks.component';
import {SortByDialog} from './sort-tasks/sort-tasks-dialog/sort-tasks.dialog.component';
import { ChartLegendComponent } from './day-statistics/chart-legend/chart-legend.component';
import { PriorityComponent } from './shared/priority/priority.component';
import {TasksFiltersService} from './services/tasks-filters.service';
import {ProjectsFiltersService} from './services/projects-filters.service';
import { FilterTagsDialogComponent } from './tags-list/filter-tags-dialog/filter-tags-dialog.component';
import {TagsFiltersService} from './services/tags-filters-service';
import {TickistMaterialModule} from './material.module';


export function instrumentOptions() {
    return {
        monitor: useLogMonitor({visible: false, position: 'right'})
    };
}


export function tokenGetter() {
    return localStorage.getItem('JWT');
}


@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        LoginComponent,
        SignupComponent,
        DashboardComponent,
        ForgotPasswordComponent,
        NavComponent,
        TagsComponent,
        TaskComponent,
        ProjectComponent,
        TasksListComponent,
        TodayComponent,
        OverdueComponent,
        FutureComponent,
        UserComponent,
        TeamComponent,
        SingleTaskComponent,
        SingleTaskSimplifiedComponent,
        FilterTasksComponent,
        NavBarLandingPageComponent,
        TaskNameComponent,
        DayStatisticsComponent,
        GlobalStatisticsComponent,
        ColorPickerComponent,
        TruncatePipe,
        Minutes2hoursPipe,
        DateToString,
        AvatarSize,
        TagComponent,
        AddTaskComponent,
        SingleProjectComponent,
        TasksFilterDialog,
        AssignedToDialog,
        TagsFilterDialog,
        SortByDialog,
        EstimateTimeDialog,
        DeleteTaskDialogComponent,
        DeleteProjectConfirmationDialogComponent,
        TimeDialogComponent,
        ChangeTaskViewComponent,
        ShowApiErrorComponent,
        RepeatString,
        RepeatStringExtension,
        TypeFinishDateString,
        AutofocusDirective,
        EditRepeatingOptionComponent,
        DateOptionsComponent,
        BlankComponent,
        RootComponent,
        TasksFromProjectsComponent,
        ProjectsListComponent,
        WeekDaysComponent,
        TagsListComponent,
        MenuButtonComponent,
        DisplayFinishDateComponent,
        ToggleButtonComponent,
        UserAvatarComponent,
        ProgressBarComponent,
        PinButtonComponent,
        RightMenuComponent,
        ChooseDayComponent,
        ShowOfflineModeComponent,
        ShowNotificationAboutNewDayComponent,
        ShowApiErrorComponent,
        FilterProjectDialogComponent,
        SortTasksComponent,
        ChartLegendComponent,
        PriorityComponent,
        FilterTagsDialogComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        RouterModule.forRoot(routes),
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
        ChartsModule,
        JwtModule.forRoot({
            config: {
                headerName: 'Authorization',
                authScheme: '',
                whitelistedDomains: ['localhost:4200', 'tickist.com', 'app.tickist.com', 'localhost:8000'],
                tokenGetter: tokenGetter
            }
        }),
        ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production })
    ],
    bootstrap: [AppComponent],
    entryComponents: [TasksFilterDialog, AssignedToDialog, TagsFilterDialog, SortByDialog, EstimateTimeDialog,
        DeleteProjectConfirmationDialogComponent, TimeDialogComponent, DeleteTaskDialogComponent,
        FilterProjectDialogComponent, FilterTagsDialogComponent
    ],
    providers: [
        {provide: LocationStrategy, useClass: HashLocationStrategy},
        {provide: DateAdapter, useClass: MyDateAdapter},
        LoggedInGuard,
        AnonymousGuard,
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
        ProjectsResolver,
        TasksResolver,
        TeamResolver,
        UserResolver,
        TagsResolver,
        SetAllTasksFilterResolver,
        SetAllTagsFilterResolver,
        {provide: HTTP_INTERCEPTORS, useClass: RequestInterceptorService, multi: true},
        {
            provide: ErrorHandler,
            useClass: MyErrorHandler
        }
    ]
})
export class AppModule {


}
