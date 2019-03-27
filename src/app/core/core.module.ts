import {NgModule} from '@angular/core';
import {TickistMaterialModule} from '../material.module';
import {NavComponent} from './header/nav-component/nav.component';
import {SearchAutocompleteComponent} from './header/search-autocomplete/search-autocomplete.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ShowOfflineModeComponent} from './header/show-offline-mode/show-offline-mode.component';
import {ShowApiErrorComponent} from './header/show-api-error/show-api-error.component';
import {TickistSharedModule} from '../shared/shared.module';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {EffectsModule} from '@ngrx/effects';
import {UserEffects} from './effects/user.effects';
import {TeamEffects} from './effects/team.effects';
import {StoreModule} from '@ngrx/store';
import * as fromUser from './reducers/user.reducer';
import * as fromTeam from './reducers/team.reducer';
import {UserService} from './services/user.service';
import {TagsEffects} from './effects/tags.effects';
import * as fromTags from './reducers/tags.reducer';
import * as from from './reducers/auth.reducer';
import {AuthEffects} from './effects/auth.effects';
import {NavBarAuthPageComponent} from './header/nav-bar-auth-page/nav-bar-auth-page.component';
import {AuthService} from './services/auth.service';
import {AuthLayoutComponent} from './layouts/auth-layout/auth-layout.component';
import {ProjectsEffects} from './effects/projects.effects';
import {ActiveProjectsIdsEffects} from './effects/active-projects-ids.effects';
import {ActiveProjectEffects} from './effects/active-project.effects';
import {TaskService} from './services/task.service';
import {HomeComponent} from './layouts/home';
import {AddTaskComponent} from './footer/add-task/add-task.component';
import {TaskEffects} from './effects/task.effects';
import * as fromTask from './reducers/tasks/task.reducer';
import * as fromProjects from './reducers/projects/projects.reducer';
import * as fromActiveProject from './reducers/active-project.reducer';
import * as fromActiveProjectsId from './reducers/active-projects-ids.reducer';
import * as fromSortTasks from './reducers/tasks/sort-tasks.reducer';
import * as fromActiveDate from './reducers/active-date.reducer';
import * as fromDetectApiError from './reducers/detect-api-error.reducer';
import * as fromOfflineMode from './reducers/offline-mode.reducer';
import * as fromProgressBar from './reducers/progress-bar.reducer';
import * as fromFilterTasks from './reducers/tasks/main-filters-tasks.reducer';
import * as fromAssignedToFiltersTasks from './reducers/tasks/assigned-to-filters-tasks.reducer';
import * as fromEstimateTimeFiltersTasks from './reducers/tasks/estimate-time-filters-tasks.reducer';
import * as fromTagsFiltersTasks from './reducers/tasks/tags-filters-tasks.reducer';
import * as fromSearchTasks from './reducers/tasks/search-tasks.reducer';
import {AssignedToFiltersTasksEffects} from './effects/assigned-to-filters-tasks.effects';
import {TasksFiltersEffects} from './effects/tasks-filters.effects';
import {ShowNotificationAboutNewDayComponent} from './header/show-notification-about-new-day/show-notification-about-new-day.component';



@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FlexLayoutModule,
        FormsModule,
        ReactiveFormsModule,
        TickistSharedModule,
        RouterModule,
        StoreModule.forFeature('user', fromUser.reducer),
        StoreModule.forFeature('team', fromTeam.reducer),
        StoreModule.forFeature('tags', fromTags.reducer),
        StoreModule.forFeature('projects', fromProjects.reducer),
        StoreModule.forFeature('activeProject', fromActiveProject.reducer),
        StoreModule.forFeature('activeProjectsIds', fromActiveProjectsId.reducer),
        StoreModule.forFeature('task', fromTask.reducer),
        StoreModule.forFeature('sortTasks', fromSortTasks.reducer),
        StoreModule.forFeature('activeDate', fromActiveDate.reducer),
        StoreModule.forFeature('progressBar', fromProgressBar.reducer),
        StoreModule.forFeature('detectApiError', fromDetectApiError.reducer),
        StoreModule.forFeature('offlineMode', fromOfflineMode.reducer),
        StoreModule.forFeature('auth', from.authReducer),
        StoreModule.forFeature('mainFiltersTasks', fromFilterTasks.reducer),
        StoreModule.forFeature('assignedToFiltersTasks', fromAssignedToFiltersTasks.reducer),
        StoreModule.forFeature('estimateTimeFiltersTasks', fromEstimateTimeFiltersTasks.reducer),
        StoreModule.forFeature('tagsFiltersTasks', fromTagsFiltersTasks.reducer),
        StoreModule.forFeature('searchTasks', fromSearchTasks.reducer),
        EffectsModule.forFeature([TaskEffects]),
        EffectsModule.forFeature([ProjectsEffects, ActiveProjectsIdsEffects, ActiveProjectEffects]),
        EffectsModule.forFeature([AuthEffects]),
        EffectsModule.forFeature([TagsEffects]),
        EffectsModule.forFeature([UserEffects, TeamEffects]),
        EffectsModule.forFeature([AssignedToFiltersTasksEffects, TasksFiltersEffects]),
    ],
    providers: [
        TaskService,
        UserService,
        AuthService
    ],
    entryComponents: [],
    exports: [
        NavComponent,
        SearchAutocompleteComponent,
        NavBarAuthPageComponent,
        AuthLayoutComponent,
        HomeComponent,
        AddTaskComponent,
    ],
    declarations: [
        NavComponent,
        SearchAutocompleteComponent,
        ShowOfflineModeComponent,
        ShowApiErrorComponent,
        NavBarAuthPageComponent,
        AuthLayoutComponent,
        HomeComponent,
        AddTaskComponent,
        ShowNotificationAboutNewDayComponent
    ]
})

export class TickistCoreModule {
}
