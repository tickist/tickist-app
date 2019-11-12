import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {FutureTasksFiltersService} from './modules/future-tasks/core/services/future-tasks-filters.service';
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
                loadChildren: () => import('./modules/dashboard/dashboard.module').then(m => m.TickistDashboardModule)
            },
            {
                path: futureTasksRoutesName.FUTURE_TASKS,
                outlet: 'content',
                canActivate: [LoggedInGuard],
                loadChildren: () => import('./modules/future-tasks/future-tasks.module').then(m => m.TickistFutureTasksModule)
            },
            {
                path: tasksTreeViewRoutesName.TASKS_TREE_VIEW,
                outlet: 'content',
                canActivate: [LoggedInGuard],
                loadChildren: () => import('./modules/tasks-tree-view/tasks-tree-view.module').then(m => m.TickistTasksTreeViewModule)
            },
            {
                path: tasksProjectsViewRoutesName.TASKS_PROJECTS_VIEW,
                outlet: 'content',
                canActivate: [LoggedInGuard],
                loadChildren: () => import('./modules/tasks-projects-view/tasks-projects-view.module')
                    .then(m => m.TickistTasksProjectsViewModule)
            },
            {
                path: tasksTagsViewRoutesName.TASKS_TAGS_VIEW,
                outlet: 'content',
                canActivate: [LoggedInGuard],
                loadChildren: () => import('./modules/tasks-tags-view/tasks-tags-view.module').then(m => m.TickistTasksTagsViewModule)
            },
            {
                path: statisticsRoutesName.STATISTICS,
                outlet: 'content',
                canActivate: [LoggedInGuard],
                loadChildren: () => import('./modules/statistics-view/statistics-view.module').then(m => m.TickistStatisticsViewModule)
            },
            {
                path: editTaskRoutesName.EDIT_TASK,
                outlet: 'content',
                canActivate: [LoggedInGuard],
                loadChildren: () => import('./modules/edit-task/edit-task.module').then(m => m.TickistEditTaskModule)
            },
            {
                path: editUserSettingsRoutesName.EDIT_USER_SETTINGS,
                outlet: 'content',
                canActivate: [LoggedInGuard],
                loadChildren: () => import('./modules/edit-user-settings/edit-user-settings.module')
                    .then(m => m.TickistEditUserSettingsModule)
            },
            {
                path: teamRoutesName.TEAM,
                outlet: 'content',
                canActivate: [LoggedInGuard],
                loadChildren: () => import('./modules/team/team.module').then(m => m.TickistTeamModule)
            },
            {
                path: editProjectSettingsRoutesName.EDIT_PROJECT,
                outlet: 'content',
                canActivate: [LoggedInGuard],
                loadChildren: () => import('./modules/edit-project/edit-project.module').then(m => m.TickistEditProjectModule)
            },
            {
                path: 'left-panel',
                outlet: 'left',
                canActivate: [LoggedInGuard],
                loadChildren: () => import('./modules/left-panel/left-panel.module').then(m => m.TickistLeftPanelModule)
            }
        ]
    },
    {
        path: signupRoutesName.SIGNUP,
        component: AuthLayoutComponent,
        canActivate: [AnonymousGuard],
        loadChildren: './modules/signup/signup.module#TickistSignUpModule'
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
