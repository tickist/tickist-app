import {Observable, pipe} from 'rxjs';
import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {environment} from '../../environments/environment';
import {AppStore} from '../store';
import {Project} from '../models/projects';
import {Task} from '../models/tasks';
import {SimplyUser, PendingUser} from '../models/user';
import {MatSnackBar} from '@angular/material';
import * as tasksAction from '../reducers/actions/tasks';
import * as projectsAction from '../reducers/actions/projects';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {Filter} from '../models/filter';
import {map} from 'rxjs/operators';
import {TaskService} from './taskService';
import {TasksFiltersService} from './tasks-filters.service';


@Injectable()
export class ProjectService {
    projects$: Observable<Project[]>;
    team$: Observable<SimplyUser[]>;
    team: SimplyUser[];
    selectedProject$: Observable<Project>;
    selectedProjectsIds$: Observable<Array<number>>;
    projectsFilters$: Observable<any>;
    currentProjectsFilters$: Observable<any>;

    constructor(public http: HttpClient, private store: Store<AppStore>, public snackBar: MatSnackBar,
                protected router: Router, protected tasksFiltersService: TasksFiltersService) {
        
        this.projects$ = this.store.select(store => store.projects);
        this.team$ = this.store.select(store => store.team);
        this.selectedProject$ = this.store.select(store => store.selectedProject);
        this.selectedProjectsIds$ = this.store.select(store => store.selectedProjectsIds);
        this.projectsFilters$ = this.store.select(store => store.projectsFilters);
        this.currentProjectsFilters$ = this.store.select(store => store.currentProjectsFilters);
        this.team$.subscribe((team) => {
            this.team = team;
        });
        this.loadProjectsFilters();
        this.loadCurrentProjectsFilters();
    }

    loadProjects() {
        return this.http.get<Project[]>(`${environment['apiUrl']}/project/`)
            .pipe(
                map(payload => payload.map(project => new Project(project))),
                map(payload => this.store.dispatch(new projectsAction.AddProjects(payload)))
            );
    }

    loadCurrentProjectsFilters() {
        const filter = new Filter({'id': 1, 'label': 'filter', 'name': 'All projects', 'value': project => project});
        this.store.dispatch(new projectsAction.AddCurrentFilters(filter));
    }

    loadProjectsFilters() {
        const filters = [
            new Filter({
                'id': 1, 'label': 'filter', 'name': 'All projects',
                'value': project => project
            }),
            new Filter({
                'id': 2, 'label': 'filter', 'name': 'Projects with tasks',
                'value': project => project.tasksCounter > 0
            }),
            new Filter({
                'id': 3, 'label': 'filter', 'name': 'Projects without tasks',
                'value': project => project.tasksCounter === 0
            })
        ];
        this.store.dispatch(new projectsAction.AddFilters(filters));
    }

    updateCurrentFilter(currentFilter) {
        this.store.dispatch(new projectsAction.UpdateCurrentFilter(currentFilter));
    }

    selectProject(project: Project | null) {
        this.store.dispatch(new projectsAction.SelectProject(project));
        this.store.dispatch(new tasksAction.DeleteNonFixedAssignedTo({}));
        if (project) {
            project.shareWith.map((user: (SimplyUser | PendingUser)) => {
                if (user.hasOwnProperty('id') && user['id'] !== undefined && user['id'] !== parseInt(localStorage.getItem('USER_ID'), 10)) {
                    this.store.dispatch(new tasksAction.AddNewAssignedTo(
                        {
                            'id': user['id'],
                            'label': 'assignedTo',
                            'value': (task: Task) => task.owner.id === user['id'],
                            'name': user.username
                        }
                    ));
                }
            });
            //const assignedToAll = this.taskFilters.find(filter => filter.label === 'assignedTo' && filter.name === 'all');
            //this.taskService.updateCurrentFilter(assignedToAll);
            this.tasksFiltersService.resetAssignedFilterToAssignedToAll();
        } else {
            this.team.map((user) => {
                this.store.dispatch(new tasksAction.AddNewAssignedTo(
                    {
                        'id': user.id,
                        'label': 'assignedTo',
                        'value': (task: Task) => task.owner.id === user.id,
                        'name': user.username
                    }
                    )
                );
            });
            //const assignedToMe = this.taskFilters.find(filter => filter.label === 'assignedTo' && filter.name === 'all');
            //this.taskService.updateCurrentFilter(this.assignedToMe);
            this.tasksFiltersService.resetAssignedFilterToAssignedToMe();
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
                const newProject = new Project(payload);
                this.store.dispatch(new projectsAction.CreateProject(newProject));
                this.router.navigate(['/home/projects', newProject.id]);
                this.loadProjects().subscribe(); // we need to update getAllDescendant set.
            });
    }

    updateProject(project: Project, withoutSnackBar = false) {
        this.http.put(`${environment['apiUrl']}/project/${project.id}/`, project.toApi())
            .subscribe(payload => {
                this.store.dispatch(new projectsAction.UpdateProject(new Project(payload)));
                if (!withoutSnackBar) {
                    this.snackBar.open('Project has been saved successfully', '', {
                    duration: 2000,
                    });
                }
                this.loadProjects().subscribe(); // we need to update getAllDescendant set.
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
