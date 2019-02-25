import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {FutureTasksFiltersService} from './modules/future-tasks/future-tasks-filters.service';
import {RouterModule, Routes} from '@angular/router';
import {LoggedInGuard} from './core/guards/loggedIn.guard';
import {AnonymousGuard} from './core/guards/anonymous.guard';
import {SetAllTasksFilterResolver} from './routing/resolvers/set-all-tasks-filter.resolver';
import {RouterStateSerializer, StoreRouterConnectingModule} from '@ngrx/router-store';
import {CustomSerializer} from './routing/custom-serializer';
import {HomeComponent} from './core/layouts/home';
import {futureTasksRoutesName} from './modules/future-tasks/routes.names';
import {dashboardRoutesName} from './modules/dashboard/routes.names';
import {tasksProjectsViewRoutesName} from './modules/tasks-projects-view/routes.names';
import {tasksTagsViewRoutesName} from './modules/tasks-tags-view/routes.names';
import {tasksTreeViewRoutesName} from './modules/tasks-tree-view/routes.names';
import {statisticsRoutesName} from './modules/statistics-view/routes.names';
import {editTaskRoutesName} from './modules/edit-task/routes-names';
import {editUserSettingsRoutesName} from './modules/edit-user-settings/routes-names';
import {teamRoutesName} from './modules/team/routes-names';
import {editProjectSettingsRoutesName} from './modules/edit-project/routes-names';
import {AuthLayoutComponent} from './core/layouts/auth-layout/auth-layout.component';
import {forgotPasswordRoutesName} from './modules/forgot-password/routes-names';
import {loginRoutesName} from './modules/login/routes-names';
import {signupRoutesName} from './modules/signup/routes-names';

export const homeRoutesName = {
    HOME: 'home'
};


export const routes: Routes = [
    {
        path: 'home',
        component: HomeComponent,
        canActivate: [LoggedInGuard],
        children: [
            {
                path: '',
                redirectTo: '/home/(content:dashboard//left:left-panel)',
                pathMatch: 'full',
            },
            {
                path: dashboardRoutesName.DASHBOARD,
                canActivate: [LoggedInGuard],
                outlet: 'content',
                loadChildren: './modules/dashboard/dashboard.module#TickistDashboardModule'
            },
            {
                path: futureTasksRoutesName.FUTURE_TASKS,
                outlet: 'content',
                canActivate: [LoggedInGuard],
                loadChildren: './modules/future-tasks/future-tasks.module#TickistFutureTasksModule'
            },
            {
                path: tasksTreeViewRoutesName.TASKS_TREE_VIEW,
                outlet: 'content',
                canActivate: [LoggedInGuard],
                loadChildren: './modules/tasks-tree-view/tasks-tree-view.module#TickistTasksTreeViewModule'
            },
            {
                path: tasksProjectsViewRoutesName.TASKS_PROJECTS_VIEW,
                outlet: 'content',
                canActivate: [LoggedInGuard],
                loadChildren: './modules/tasks-projects-view/tasks-projects-view.module#TickistTasksProjectsViewModule'
            },
            {
                path: tasksTagsViewRoutesName.TASKS_TAGS_VIEW,
                outlet: 'content',
                canActivate: [LoggedInGuard],
                loadChildren: './modules/tasks-tags-view/tasks-tags-view.module#TickistTasksTagsViewModule'
            },
            {
                path: statisticsRoutesName.STATISTICS,
                outlet: 'content',
                canActivate: [LoggedInGuard],
                loadChildren: './modules/statistics-view/statistics-view.module#TickistStatisticsViewModule'
            },
            {
                path: editTaskRoutesName.EDIT_TASK,
                outlet: 'content',
                canActivate: [LoggedInGuard],
                loadChildren: './modules/edit-task/edit-task.module#TickistEditTaskModule'
            },
            {
                path: editUserSettingsRoutesName.EDIT_USER_SETTINGS,
                outlet: 'content',
                canActivate: [LoggedInGuard],
                loadChildren: './modules/edit-user-settings/edit-user-settings.module#TickistEditUserSettingsModule'
            },
            {
                path: teamRoutesName.TEAM,
                outlet: 'content',
                canActivate: [LoggedInGuard],
                loadChildren: './modules/team/team.module#TickistTeamModule'
            },
            {
                path: editProjectSettingsRoutesName.EDIT_PROJECT,
                outlet: 'content',
                canActivate: [LoggedInGuard],
                loadChildren: './modules/edit-project/edit-project.module#TickistEditProjectModule'
            },
            {
                path: 'left-panel',
                outlet: 'left',
                canActivate: [LoggedInGuard],
                loadChildren: './modules/left-panel/left-panel.module#TickistLeftPanelModule'
            }
        ]
    },
    {
        path: signupRoutesName.SIGNUP,
        component: AuthLayoutComponent,
        canActivate: [AnonymousGuard],
        loadChildren: './modules/signup/signup.module#TickistSignupModule'
    },
    {
        path: loginRoutesName.LOGIN,
        component: AuthLayoutComponent,
        canActivate: [AnonymousGuard],
        loadChildren: './modules/login/login.module#TickistLoginModule'
    },
    {
        path: forgotPasswordRoutesName.FORGOT_PASSWORD,
        component: AuthLayoutComponent,
        canActivate: [AnonymousGuard],
        loadChildren: './modules/forgot-password/forgot-password.module#TickistForgotPasswordModule'
    },
    {
        path: '',
        redirectTo: '/home/(content:dashboard//left:left-panel)',
        // redirectTo: '/home/(content:dashboard/)',
        pathMatch: 'full'
    }
];


@NgModule({
    imports: [
        CommonModule,
        RouterModule.forRoot(routes),
        StoreRouterConnectingModule.forRoot({stateKey: 'router'})
    ],
    declarations: [],
    providers: [
        SetAllTasksFilterResolver,
        FutureTasksFiltersService,
        LoggedInGuard,
        AnonymousGuard,
        {provide: RouterStateSerializer, useClass: CustomSerializer}
    ],
    exports: [
        RouterModule
    ]
})
export class TickistRoutingModule {
}
