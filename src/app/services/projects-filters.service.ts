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


@Injectable()
export class ProjectsFiltersService {
    projects$: Observable<Project[]>;
    team$: Observable<SimplyUser[]>;
    team: SimplyUser[];
    selectedProject$: Observable<Project>;
    selectedProjectsIds$: Observable<Array<number>>;
    projectsFilters$: Observable<any>;
    currentProjectsFilters$: Observable<any>;

    constructor(public http: HttpClient, private store: Store<AppStore>, public snackBar: MatSnackBar,
                protected router: Router) {

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
}
