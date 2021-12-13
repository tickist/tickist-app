import { NgModule } from "@angular/core";
import { TickistMaterialModule } from "../material.module";
import { NavComponent } from "./header/nav-component/nav.component";
import { SearchAutocompleteComponent } from "./header/search-autocomplete/search-autocomplete.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ShowOfflineModeComponent } from "./header/show-offline-mode/show-offline-mode.component";
import { ShowApiErrorComponent } from "./header/show-api-error/show-api-error.component";
import { TickistSharedModule } from "../shared/shared.module";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { EffectsModule } from "@ngrx/effects";
import { UserEffects } from "./effects/user.effects";
import { StoreModule } from "@ngrx/store";
import * as fromUser from "./reducers/user.reducer";
import * as fromAddTaskButtonVisibility from "./reducers/add-task-button-visibility.reducer";
import { TagsEffects } from "./effects/tags.effects";
import * as fromTags from "./reducers/tags.reducer";
import * as from from "./reducers/auth.reducer";
import { AuthEffects } from "./effects/auth.effects";
import { NavBarAuthPageComponent } from "./header/nav-bar-auth-page/nav-bar-auth-page.component";
import { AuthLayoutComponent } from "./layouts/auth-layout/auth-layout.component";
import { ProjectsEffects } from "./effects/projects.effects";
import { ActiveProjectEffects } from "./effects/active-project.effects";
import { HomeComponent } from "./layouts/home";
import { AddTaskFooterButtonComponent } from "./footer/add-task-footer-button/add-task-footer-button.component";
import { TaskEffects } from "./effects/task.effects";
import * as fromTask from "./reducers/tasks/task.reducer";
import * as fromProjects from "./reducers/projects/projects.reducer";
import * as fromActiveProject from "./reducers/active-project.reducer";
import * as fromActiveProjectsId from "./reducers/active-projects-ids.reducer";
import * as fromSortTasks from "./reducers/tasks/sort-tasks.reducer";
import * as fromActiveDate from "./reducers/active-date.reducer";
import * as fromDetectApiError from "./reducers/detect-api-error.reducer";
import * as fromProgressBar from "./reducers/progress-bar.reducer";
import * as fromFilterTasks from "./reducers/tasks/main-filters-tasks.reducer";
import * as fromAssignedToFiltersTasks from "./reducers/tasks/assigned-to-filters-tasks.reducer";
import * as fromEstimateTimeFiltersTasks from "./reducers/tasks/estimate-time-filters-tasks.reducer";
import * as fromTagsFiltersTasks from "./reducers/tasks/tags-filters-tasks.reducer";
import * as fromSearchTasks from "./reducers/tasks/search-tasks.reducer";
import * as ui from "./reducers/ui.reducer";
import { TasksFiltersEffects } from "./effects/tasks-filters.effects";
import { ShowNotificationAboutNewDayComponent } from "./header/show-notification-about-new-day/show-notification-about-new-day.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { AngularFireAuthModule } from "@angular/fire/compat/auth";
import { AngularFirestoreModule } from "@angular/fire/compat/firestore";
import { AngularFireStorageModule } from "@angular/fire/compat/storage";
import { TickistSingleTaskModule } from "../single-task/single-task.module";
import { TickistNotificationsModule } from "../modules/notifications/notifications.module";
import { A11yModule } from "@angular/cdk/a11y";
import { PrivacyPolicyComponent } from "./footer/privacy-policy/privacy-policy.component";

@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FlexLayoutModule,
        FormsModule,
        ReactiveFormsModule,
        TickistSharedModule,
        RouterModule,
        StoreModule.forFeature("user", fromUser.reducer),
        StoreModule.forFeature("tags", fromTags.reducer),
        StoreModule.forFeature("projects", fromProjects.reducer),
        StoreModule.forFeature("activeProject", fromActiveProject.reducer),
        StoreModule.forFeature(
            "activeProjectsIds",
            fromActiveProjectsId.reducer
        ),
        StoreModule.forFeature("task", fromTask.reducer),
        StoreModule.forFeature("sortTasks", fromSortTasks.reducer),
        StoreModule.forFeature("activeDate", fromActiveDate.reducer),
        StoreModule.forFeature("progressBar", fromProgressBar.reducer),
        StoreModule.forFeature("detectApiError", fromDetectApiError.reducer),
        StoreModule.forFeature("auth", from.reducer),
        StoreModule.forFeature("mainFiltersTasks", fromFilterTasks.reducer),
        StoreModule.forFeature(
            "assignedToFiltersTasks",
            fromAssignedToFiltersTasks.reducer
        ),
        StoreModule.forFeature(
            "estimateTimeFiltersTasks",
            fromEstimateTimeFiltersTasks.reducer
        ),
        StoreModule.forFeature(
            "tagsFiltersTasks",
            fromTagsFiltersTasks.reducer
        ),
        StoreModule.forFeature("searchTasks", fromSearchTasks.reducer),
        StoreModule.forFeature(
            "addTaskButtonVisibility",
            fromAddTaskButtonVisibility.reducer
        ),
        StoreModule.forFeature("ui", ui.reducer),
        EffectsModule.forFeature([TaskEffects]),
        EffectsModule.forFeature([TaskEffects]),
        EffectsModule.forFeature([ProjectsEffects, ActiveProjectEffects]),
        EffectsModule.forFeature([AuthEffects]),
        EffectsModule.forFeature([TagsEffects]),
        EffectsModule.forFeature([UserEffects]),
        EffectsModule.forFeature([TasksFiltersEffects]),
        FontAwesomeModule,
        AngularFireAuthModule,
        AngularFireStorageModule,
        TickistSingleTaskModule,
        TickistNotificationsModule,
        A11yModule,
    ],
    exports: [
        NavComponent,
        SearchAutocompleteComponent,
        NavBarAuthPageComponent,
        AuthLayoutComponent,
        HomeComponent,
        AddTaskFooterButtonComponent,
        PrivacyPolicyComponent,
    ],
    declarations: [
        NavComponent,
        SearchAutocompleteComponent,
        ShowOfflineModeComponent,
        ShowApiErrorComponent,
        NavBarAuthPageComponent,
        AuthLayoutComponent,
        HomeComponent,
        AddTaskFooterButtonComponent,
        ShowNotificationAboutNewDayComponent,
        PrivacyPolicyComponent,
    ],
})
export class TickistCoreModule {}
