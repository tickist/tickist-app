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
import {map} from 'rxjs/operators';
import {TasksFiltersService} from './tasks-filters.service';
import * as _ from 'lodash';


@Injectable()
export class ProjectService {
    projects$: Observable<Project[]>;
    team$: Observable<SimplyUser[]>;
    team: SimplyUser[];
    selectedProject$: Observable<Project>;
    selectedProjectsIds$: Observable<Array<number>>;
    
    
    static sortProjectList(projects) {
        projects = _.orderBy(projects,
                    ['isInbox', 'name'],
                    ['desc', 'asc']
                );

        const list_of_list = [],
            the_first_level = projects.filter((project) => project.level === 0),
            the_second_level = projects.filter((project) => project.level === 1),
            the_third_level = projects.filter((project) => project.level === 2);
        the_first_level.forEach((item_0) => {
            list_of_list.push(item_0);
            the_second_level.forEach((item_1) => {
                if (item_0.allDescendants.indexOf(item_1.id) > -1) {
                    list_of_list.push(item_1);
                    the_third_level.forEach((item_2) => {
                        if (item_1.allDescendants.indexOf(item_2.id) > -1) {
                            list_of_list.push(item_2);
                        }
                    });
                }
            });

        });
        // if we have a shared list on the second level
        the_second_level.forEach((item_1) => {
            if (list_of_list.indexOf(item_1) === -1) {
                item_1.level = 0;
                list_of_list.push(item_1);
                the_third_level.forEach((item_2) => {
                    if (item_1.allDescendants.indexOf(item_2.id) > -1) {
                        list_of_list.push(item_2);

                    }
                });
            }
        });
        // if we have the shared lists on the third level
        the_third_level.forEach((item_2) => {
            if (list_of_list.indexOf(item_2) === -1) {
                item_2.level = 0;
                list_of_list.push(item_2);
            }
        });
        return list_of_list;
    }

    constructor(public http: HttpClient, private store: Store<AppStore>, public snackBar: MatSnackBar,
                protected router: Router, protected tasksFiltersService: TasksFiltersService) {

        this.projects$ = this.store.select(storeElem => storeElem.projects);
        this.team$ = this.store.select(storeElem => storeElem.team);
        this.selectedProject$ = this.store.select(storeElem => storeElem.selectedProject);
        this.selectedProjectsIds$ = this.store.select(storeElem => storeElem.selectedProjectsIds);
        this.team$.subscribe(team => {
            this.team = team;
        });
    }

    loadProjects() {
        return this.http.get<Project[]>(`${environment['apiUrl']}/project/`)
            .pipe(
                map(payload => payload.map(project => new Project(project))),
                map(payload => this.store.dispatch(new projectsAction.AddProjects(payload)))
            );
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
