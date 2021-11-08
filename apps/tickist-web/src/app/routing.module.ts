import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FutureTasksFiltersService } from "./modules/future-tasks/core/services/future-tasks-filters.service";
import { RouterModule, Routes } from "@angular/router";
import { LoggedInGuard } from "./core/guards/loggedIn.guard";
import { AnonymousGuard } from "./core/guards/anonymous.guard";
import {
    RouterStateSerializer,
    StoreRouterConnectingModule,
    DefaultRouterStateSerializer,
} from "@ngrx/router-store";
import { CustomSerializer } from "./routing/custom-serializer";
import { HomeComponent } from "./core/layouts/home";
import { futureTasksRoutesName } from "./modules/future-tasks/routes.names";
import { weekdaysRoutesName } from "./modules/weekdays/routes.names";
import { tasksProjectsViewRoutesName } from "./modules/tasks-projects-view/routes.names";
import { tasksTagsViewRoutesName } from "./modules/tasks-tags-view/routes.names";
import { tasksTreeViewRoutesName } from "./modules/tasks-tree-view/routes.names";
import { statisticsRoutesName } from "./modules/statistics-view/routes.names";
import { editTaskRoutesName } from "./modules/edit-task/routes-names";
import { editUserSettingsRoutesName } from "./modules/edit-user-settings/routes-names";
import { teamRoutesName } from "./modules/team/routes-names";
import { editProjectSettingsRoutesName } from "./modules/edit-project/routes-names";
import { AuthLayoutComponent } from "./core/layouts/auth-layout/auth-layout.component";
import { resetPasswordRoutesName } from "./modules/reset-password/routes-names";
import { loginRoutesName } from "./modules/login/routes-names";
import { signupRoutesName } from "./modules/sign-up/routes-names";
import { LeftPanelComponent } from "./modules/left-panel/pages/left-panel/left-panel.component";
import { dashboardRoutesName } from "./modules/dashboard/routes.names";
import { archiveRoutesName } from "./modules/archives/routes.names";

export const routes: Routes = [
    {
        path: "home",
        component: HomeComponent,
        canActivate: [LoggedInGuard],
        children: [
            {
                path: "",
                canActivate: [LoggedInGuard],
                outlet: "left",
                component: LeftPanelComponent,
            },
            {
                path: dashboardRoutesName.dashboard,
                canActivate: [LoggedInGuard],
                loadChildren: () =>
                    import("./modules/dashboard/dashboard.module").then(
                        (m) => m.TickistDashboardModule
                    ),
            },
            {
                path: weekdaysRoutesName.weekdays,
                canActivate: [LoggedInGuard],
                loadChildren: () =>
                    import("./modules/weekdays/weekdays.module").then(
                        (m) => m.TickistWeekdaysModule
                    ),
            },
            {
                path: futureTasksRoutesName.futureTasks,
                canActivate: [LoggedInGuard],
                loadChildren: () =>
                    import("./modules/future-tasks/future-tasks.module").then(
                        (m) => m.TickistFutureTasksModule
                    ),
            },
            {
                path: tasksTreeViewRoutesName.tasksTreeView,
                canActivate: [LoggedInGuard],
                loadChildren: () =>
                    import(
                        "./modules/tasks-tree-view/tasks-tree-view.module"
                    ).then((m) => m.TickistTasksTreeViewModule),
            },
            {
                path: tasksProjectsViewRoutesName.tasksProjectsView,
                canActivate: [LoggedInGuard],
                loadChildren: () =>
                    import(
                        "./modules/tasks-projects-view/tasks-projects-view.module"
                    ).then((m) => m.TickistTasksProjectsViewModule),
            },
            {
                path: tasksTagsViewRoutesName.tasksTagsView,
                canActivate: [LoggedInGuard],
                loadChildren: () =>
                    import(
                        "./modules/tasks-tags-view/tasks-tags-view.module"
                    ).then((m) => m.TickistTasksTagsViewModule),
            },
            {
                path: statisticsRoutesName.statistics,
                canActivate: [LoggedInGuard],
                loadChildren: () =>
                    import(
                        "./modules/statistics-view/statistics-view.module"
                    ).then((m) => m.TickistStatisticsViewModule),
            },
            {
                path: editTaskRoutesName.editTask,
                canActivate: [LoggedInGuard],
                loadChildren: () =>
                    import("./modules/edit-task/edit-task.module").then(
                        (m) => m.TickistEditTaskModule
                    ),
            },
            {
                path: editUserSettingsRoutesName.editUserSettings,
                canActivate: [LoggedInGuard],
                loadChildren: () =>
                    import(
                        "./modules/edit-user-settings/edit-user-settings.module"
                    ).then((m) => m.TickistEditUserSettingsModule),
            },
            {
                path: teamRoutesName.team,
                canActivate: [LoggedInGuard],
                loadChildren: () =>
                    import("./modules/team/team.module").then(
                        (m) => m.TickistTeamModule
                    ),
            },
            {
                path: editProjectSettingsRoutesName.editProject,
                canActivate: [LoggedInGuard],
                loadChildren: () =>
                    import("./modules/edit-project/edit-project.module").then(
                        (m) => m.TickistEditProjectModule
                    ),
            },
            {
                path: archiveRoutesName.archive,
                canActivate: [LoggedInGuard],
                loadChildren: () =>
                    import("./modules/archives/archive.module").then(
                        (m) => m.ArchiveModule
                    ),
            },
            {
                path: "",
                redirectTo: "/home/dashboard",
                pathMatch: "full",
            },
        ],
    },
    {
        path: signupRoutesName.signUp,
        component: AuthLayoutComponent,
        canActivate: [AnonymousGuard],
        loadChildren: () =>
            import("./modules/sign-up/sign-up.module").then(
                (m) => m.TickistSignUpModule
            ),
    },
    {
        path: loginRoutesName.login,
        component: AuthLayoutComponent,
        canActivate: [AnonymousGuard],
        loadChildren: () =>
            import("./modules/login/login.module").then(
                (m) => m.TickistLoginModule
            ),
    },
    {
        path: resetPasswordRoutesName.resetPassword,
        component: AuthLayoutComponent,
        canActivate: [AnonymousGuard],
        loadChildren: () =>
            import("./modules/reset-password/reset-password.module").then(
                (m) => m.TickistResetPasswordModule
            ),
    },
    {
        path: "",
        redirectTo: "/home/weekdays",
        pathMatch: "full",
    },
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forRoot(routes, { relativeLinkResolution: "legacy" }),
        StoreRouterConnectingModule.forRoot({
            serializer: DefaultRouterStateSerializer,
            stateKey: "router",
        }),
    ],
    declarations: [],
    providers: [
        FutureTasksFiltersService,
        LoggedInGuard,
        AnonymousGuard,
        { provide: RouterStateSerializer, useClass: CustomSerializer },
    ],
    exports: [RouterModule],
})
export class TickistRoutingModule {}
