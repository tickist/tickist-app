import {Observable} from 'rxjs/Observable';
import {Injectable} from '@angular/core';
import {Headers, RequestOptions} from '@angular/http';
import {Store} from '@ngrx/store';
import {environment} from '../../environments/environment';
import {AppStore} from '../store';
import {Project} from '../models/projects';
import {SimplyUser, PendingUser} from '../models/user';
import {MatSnackBar} from '@angular/material';
import * as tasksAction from '../reducers/actions/tasks';
import * as projectsAction from '../reducers/actions/projects';
import {HttpClient} from "@angular/common/http";


@Injectable()
export class ProjectService {
  projects$: Observable<Project[]>;
  team$: Observable<SimplyUser[]>;
  team: SimplyUser[];
  selectedProject$: Observable<Project>;
  selectedProjectsIds$: Observable<Array<number>>;
  headers: Headers;
  options: RequestOptions;

  constructor(public http: HttpClient, private store: Store<AppStore>, public snackBar: MatSnackBar) {
    this.projects$ = this.store.select(store => store.projects);
    this.team$ = this.store.select(store => store.team);
    this.selectedProject$ = this.store.select(store => store.selectedProject);
    this.selectedProjectsIds$ = this.store.select(store => store.selectedProjectsIds);
    this.headers = new Headers({'Content-Type': 'application/json'});
    this.options = new RequestOptions({headers: this.headers});
    this.team$.subscribe((team) => {
      this.team = team;
    })
  }

  loadProjects() {
    return this.http.get<Project[]>(`${environment['apiUrl']}/project/`)
      .map(payload => payload.map(project => new Project(project)))
      .map(payload => this.store.dispatch(new projectsAction.AddProjects(payload)));
  }

  selectProject(project: Project) {
    this.store.dispatch(new projectsAction.SelectProject(project));
    this.store.dispatch(new tasksAction.DeleteNonFixedAssignedTo({}));
    if (project) {
      project.shareWith.map((user: (SimplyUser | PendingUser)) => {
        if (user.hasOwnProperty('id') && user['id'] !== undefined && user['id'] !== parseInt(localStorage.getItem('USER_ID'), 10)) {
          this.store.dispatch(new tasksAction.AddNewAssignedTo(
            {
              'id': user['id'],
              'label': 'assignedTo',
              'value': task => task.owner.id === user['id'],
              'name': user.username
            }
          ));
        }
      });
    } else {
      this.team.map((user) => {
        this.store.dispatch(new tasksAction.AddNewAssignedTo(
          {
            'id': user.id,
            'label': 'assignedTo',
            'value': task => task.owner.id === user.id,
            'name': user.username
          }
          )
        );
      });
    }
  }

  saveProject(project: Project) {
    (project.id) ? this.updateProject(project) : this.createProject(project);
  }

  createProject(project: Project) {
    this.http.post(`${environment['apiUrl']}/project/`, project.toApi())
      .subscribe(payload => {
        this.snackBar.open('Project has been saved successfully', '', {
          duration: 2000,
        });
        this.store.dispatch(new projectsAction.CreateProject(new Project(payload)));
      });
  }

  updateProject(project: Project) {
    this.http.put(`${environment['apiUrl']}/project/${project.id}/`, project.toApi())
      .subscribe(payload => {
        this.store.dispatch(new projectsAction.UpdateProject(new Project(payload)));
        this.snackBar.open('Project has been saved successfully', '', {
          duration: 2000,
        });
      });
  }


  deleteProject(project: Project) {
    this.http.delete(`${environment['apiUrl']}/project/${project.id}/`)
      .subscribe(action => {
        this.store.dispatch(new projectsAction.DeleteProject(project));
        this.snackBar.open('Project has been deleted successfully', '', {
          duration: 2000,
        });
      });
  }

  selectProjectsIds(ids: Array<number>) {
    this.store.dispatch(new projectsAction.NewIds(ids));
  }

  updateElementFromSelectedProjectsIds(id: number) {
    this.store.dispatch(new projectsAction.AddNewId(id));
  }

  deleteElementFromSelectedProjectsIds(id: number) {
    this.store.dispatch(new projectsAction.DeleteId(id));
  }
}
