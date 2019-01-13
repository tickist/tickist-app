import {Observable, pipe} from 'rxjs';
import {Injectable} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {environment} from '../../environments/environment';
import {AppStore} from '../store';
import {Project} from '../models/projects';
import {Task} from '../models/tasks';
import {SimpleUser, PendingUser, User} from '../models/user';
import {MatSnackBar} from '@angular/material';
import * as tasksAction from '../reducers/actions/tasks';
import * as projectsAction from '../reducers/actions/projects';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {Filter} from '../models/filter';
import {UserService} from './user.service';


@Injectable()
export class ProjectsFiltersService {
    projectsFilters$: Observable<any>;
    currentProjectsFilters$: Observable<any>;
    filters: Filter[];
    user: User;

    constructor(public http: HttpClient, private store: Store<AppStore>, public snackBar: MatSnackBar,
                protected router: Router, protected userService: UserService) {
        this.projectsFilters$ = this.store.pipe(
            select(s => s.projectsFilters)
        );
        this.currentProjectsFilters$ = this.store.pipe(
            select(s => s.currentProjectsFilters)
        );
        this.filters = [
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
        this.userService.user$.subscribe(user => {
            if (user) {
                 this.user = user;
                this.loadCurrentProjectsFilters();
            }
        });
        this.loadProjectsFilters();

    }

    loadCurrentProjectsFilters() {
        const filter = this.filters.find(elem => elem.id === this.user.projectsFilterId);
        this.store.dispatch(new projectsAction.AddCurrentFilters(filter));
    }

    loadProjectsFilters() {
        this.store.dispatch(new projectsAction.AddFilters(this.filters));
    }

    updateCurrentFilter(currentFilter) {
        this.user.updateProjectsFilterId(currentFilter);
        this.userService.updateUser(this.user, false);
        this.store.dispatch(new projectsAction.UpdateCurrentFilter(currentFilter));
    }
}
