import {Routes} from '@angular/router';





export const routes: Routes = [
    // {
    //     path: 'dashboard',
    //     component: HomeComponent,
    //     canActivate: [LoggedInGuard],
    //     loadChildren: '../modules/dashboard/dashboard.module#TickistDashboardModule'
    // },
    // {
    //     path: '',
    //     redirectTo: 'dashboard',
    //     pathMatch: 'full'
    // }
    // {
    //     path: '', component: HomeComponent, canActivate: [LoggedInGuard], children: [
    //         {
    //             path: 'projects/:projectId', component: TasksFromProjectsComponent, resolve: {
    //                 setAllTasksFilter: SetAllTasksFilterResolver,
    //             }
    //         },
    //         {path: 'projects', component: ProjectsListComponent, outlet: 'leftSideNav'},
    //         {
    //             path: 'projects', component: TasksFromProjectsComponent, resolve: {
    //                 setAllTasksFilter: SetAllTasksFilterResolver,
    //             }
    //         },
    //         {path: 'project', component: ProjectComponent},
    //         {path: 'project/:projectId', component: ProjectComponent},
    //         {path: 'task', component: TaskComponent},
    //         {path: 'task/:taskId', component: TaskComponent},
    //         {path: 'tags', component: TagsComponent},
    //         {
    //             path: 'tags', component: TagsListComponent, outlet: 'leftSideNav'
    //         },
    //         {path: 'team', component: TeamComponent},
    //         {path: 'user', component: UserComponent},
    //         {path: 'tasks-tree-view', component: TasksTreeViewMainViewComponent},
    //         {path: 'future-tasks/:date', component: HomeComponent},
    //         {path: '', component: LeftPanelComponent, outlet: 'leftSideNav'},
    //         {path: '', component: DashboardComponent},
    //
    //     ],
    //     resolve: {
    //         tags: TagsResolver,
    //         team: TeamResolver,
    //         tasks: TasksResolver,
    //         projects: ProjectsResolver,
    //     }
    // },
    // {path: 'signup', component: SignupComponent, canActivate: [AnonymousGuard]},
    // {path: 'login', component: LoginComponent, canActivate: [AnonymousGuard]},
    // {path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [AnonymousGuard]},
];
