import {Routes} from '@angular/router';
import {LoginComponent} from '../auth/login';
import {LoggedInGuard} from './guards/loggedIn.guard';
import {AnonymousGuard} from './guards/anonymous.guard';
import {HomeComponent} from '../home';
import {SignupComponent} from '../auth/signup/signup.component';
import {DashboardComponent} from '../dashboard';
import {ForgotPasswordComponent} from '../auth/forgot-password';
import {ProjectComponent} from '../projects/project-component/project.component';
import {TagsComponent} from '../tags/tags-component/tags.component';
import {TaskComponent} from '../task-component/task.component';
import {TeamComponent} from '../user/team/team.component';
import {UserComponent} from '../user/user/user.component';
import {TasksFromProjectsComponent} from '../tasks-from-projects/tasks-from-projects.component';
import {ProjectsListComponent} from '../projects/projects-list/projects-list.component';
import {TagsListComponent} from '../tags/tags-list/tags-list.component';
import {DaysWeeksYearListComponent} from '../dashboard/days-weeks-year-list/days-weeks-year-list.component';
import {FutureTasksComponent} from '../dashboard/future-tasks/future-tasks.component';
import {ProjectsResolver} from './resolvers/project.resolver';
import {TasksResolver} from './resolvers/tasks.resolver';
import {TagsResolver} from './resolvers/tags.resolver';
import {TeamResolver} from './resolvers/team.resolver';
import {SetAllTasksFilterResolver} from './resolvers/set-all-tasks-filter.resolver';



export const routes: Routes = [
    {path: '', redirectTo: 'home', pathMatch: 'full'},
    {
        path: 'home', component: HomeComponent, canActivate: [LoggedInGuard], children: [
            {
                path: 'projects/:projectId', component: TasksFromProjectsComponent, resolve: {
                    setAllTasksFilter: SetAllTasksFilterResolver,
                }
            },
            {path: 'projects', component: ProjectsListComponent, outlet: 'leftSideNav'},
            {
                path: 'projects', component: TasksFromProjectsComponent, resolve: {
                    setAllTasksFilter: SetAllTasksFilterResolver,
                }
            },
            {path: 'project', component: ProjectComponent},
            {path: 'project/:projectId', component: ProjectComponent},
            {path: 'task', component: TaskComponent},
            {path: 'task/:taskId', component: TaskComponent},
            {path: 'tags', component: TagsComponent},
            {
                path: 'tags', component: TagsListComponent, outlet: 'leftSideNav'
            },
            {path: 'team', component: TeamComponent},
            {path: 'user', component: UserComponent},
            {path: '', component: DaysWeeksYearListComponent, outlet: 'leftSideNav'},
            {path: '', component: DashboardComponent},
            {path: ':date', component: DashboardComponent},
            {path: 'future/:date', component: FutureTasksComponent},
        ],
        resolve: {
            tags: TagsResolver,
            team: TeamResolver,
            tasks: TasksResolver,
            projects: ProjectsResolver,
        }
    },
    {path: 'signup', component: SignupComponent, canActivate: [AnonymousGuard]},
    {path: 'login', component: LoginComponent, canActivate: [AnonymousGuard]},
    {path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [AnonymousGuard]},
];
