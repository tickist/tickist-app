import {Routes, ActivatedRouteSnapshot, RouterStateSnapshot, Resolve} from '@angular/router';
import {LoginComponent} from './login/login.component';
import {LoggedInGuard} from './guards/loggedIn.guard';
import {AnonymousGuard} from './guards/anonymous.guard';
import {HomeComponent} from './home/home.component';
import {SignupComponent} from './signup/signup.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {AboutComponent} from './about/about.component';
import {ForgotPasswordComponent} from './forgot-password/forgot-password.component';
import {ProjectComponent} from './project-component/project.component';
import {TagsComponent} from './tags-component/tags.component';
import {TaskComponent} from './task-component/task.component';
import {TeamComponent} from './team/team.component';
import {UserComponent} from './user/user.component';
import {Injectable} from '@angular/core';
import {ProjectService} from './services/projectService';
import {TagService} from './services/tagService';
import {UserService} from './services/userService';
import {Observable} from 'rxjs/Observable';
import {Project} from './models/projects';
import {Task} from './models/tasks';
import {TaskService} from './services/taskService';
import { TasksFromProjectsComponent } from './tasks-from-projects/tasks-from-projects.component';
import {WeekDaysComponent} from './dashboard/weekdays/weekdays.component';
import {ProjectsListComponent} from './projects-list/projects-list.component';
import {TagsListComponent} from './tags-list/tags-list.component';


@Injectable()
export class UserResolver implements Resolve<any> {
  constructor(private userService: UserService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>|Promise<any>|any {
    return this.userService.loadUser();
  }
}

@Injectable()
export class TagsResolver implements Resolve<any> {
  constructor(private tagService: TagService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>|Promise<any>|any {
    return this.tagService.loadTags();
  }
}

@Injectable()
export class TasksResolver implements Resolve<Task> {
  constructor(private taskService: TaskService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>|Promise<any>|any {
    return this.taskService.loadTasks();
  }
}

@Injectable()
export class TeamResolver implements Resolve<Task> {
  constructor(private userService: UserService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>|Promise<any>|any {
    return this.userService.loadTeam();
  }
}

@Injectable()
export class ProjectsResolver implements Resolve<Project> {
  constructor(private projectService: ProjectService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>|Promise<any>|any {
    return this.projectService.loadProjects();
  }
}


export const routes: Routes = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: 'home', component: HomeComponent, canActivate: [LoggedInGuard],  children: [
      { path: 'projects/:projectId', component: TasksFromProjectsComponent},
      { path: 'projects', component: ProjectsListComponent , outlet: 'leftSideNav'},
      { path: 'projects', component: TasksFromProjectsComponent},
      { path: 'project', component: ProjectComponent },
      { path: 'project/:projectId', component: ProjectComponent },
      { path: 'task', component: TaskComponent },
      { path: 'task/:taskId', component: TaskComponent },
      { path: 'tags', component: TagsComponent },
      { path: 'tags', component: TagsListComponent, outlet: 'leftSideNav'},
      { path: 'team', component: TeamComponent },
      { path: 'user', component: UserComponent },
      { path: '', component: WeekDaysComponent, outlet: 'leftSideNav'},
      { path: '', component: DashboardComponent},
      { path: ':date', component: DashboardComponent},
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
  {path: 'about', component: AboutComponent}
];
