import {Routes} from '@angular/router';
import {LoginComponent} from './login';
import {LoggedInGuard} from './routing/guards/loggedIn.guard';
import {AnonymousGuard} from './routing/guards/anonymous.guard';
import {HomeComponent} from './home';
import {SignupComponent} from './signup/signup.component';
import {DashboardComponent} from './dashboard';
import {ForgotPasswordComponent} from './forgot-password';
import {ProjectComponent} from './project-component/project.component';
import {TagsComponent} from './tags-component/tags.component';
import {TaskComponent} from './task-component/task.component';
import {TeamComponent} from './team/team.component';
import {UserComponent} from './user/user.component';
import {TasksFromProjectsComponent} from './tasks-from-projects/tasks-from-projects.component';
import {ProjectsListComponent} from './projects-list/projects-list.component';
import {TagsListComponent} from './tags-list/tags-list.component';
import {DaysWeeksYearListComponent} from './dashboard/days-weeks-year-list/days-weeks-year-list.component';
import {FutureTasksComponent} from './dashboard/future-tasks/future-tasks.component';
import {ProjectsResolver} from './routing/resolvers/project.resolver';
import {TasksResolver} from './routing/resolvers/tasks.resolver';
import {TagsResolver} from './routing/resolvers/tags.resolver';
import {TeamResolver} from './routing/resolvers/team.resolver';
import {UserResolver} from './routing/resolvers/user.resolver';
import {SetAllTasksFilterResolver} from './routing/resolvers/set-all-tasks-filter.resolver';
import {CloseMenuInTasksResolver} from './routing/resolvers/close-menu-in-tasks.resolver';


export const routes: Routes = [
    {path: '', redirectTo: 'home', pathMatch: 'full'},
    {
        path: 'home', component: HomeComponent, canActivate: [LoggedInGuard], children: [
            {
                path: 'projects/:projectId', component: TasksFromProjectsComponent, resolve: {
                    setAllTasksFilter: SetAllTasksFilterResolver,
                    CloseMenuInTasksResolver: CloseMenuInTasksResolver
                }
            },
            {path: 'projects', component: ProjectsListComponent, outlet: 'leftSideNav'},
            {
                path: 'projects', component: TasksFromProjectsComponent, resolve: {
                    setAllTasksFilter: SetAllTasksFilterResolver,
                    CloseMenuInTasksResolver: CloseMenuInTasksResolver
                }
            },
            {path: 'project', component: ProjectComponent},
            {path: 'project/:projectId', component: ProjectComponent},
            {path: 'task', component: TaskComponent},
            {path: 'task/:taskId', component: TaskComponent},
            {path: 'tags', component: TagsComponent},
            {
                path: 'tags', component: TagsListComponent, outlet: 'leftSideNav', resolve: {
                    CloseMenuInTasksResolver: CloseMenuInTasksResolver
                }
            },
            {path: 'team', component: TeamComponent},
            {path: 'user', component: UserComponent},
            {path: '', component: DaysWeeksYearListComponent, outlet: 'leftSideNav'},
            {path: '', component: DashboardComponent},
            {path: ':date', component: DashboardComponent},
            {path: 'future/:date', component: FutureTasksComponent},
        ],
        resolve: {
            projects: ProjectsResolver,
            tasks: TasksResolver,
            tags: TagsResolver,
            user: UserResolver,
            team: TeamResolver
        }
    },
    {path: 'signup', component: SignupComponent, canActivate: [AnonymousGuard]},
    {path: 'login', component: LoginComponent, canActivate: [AnonymousGuard]},
    {path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [AnonymousGuard]},
];
