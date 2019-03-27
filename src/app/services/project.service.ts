import {Observable, pipe} from 'rxjs';
import {Injectable} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {environment} from '../../environments/environment';
import {AppStore} from '../store';
import {Project} from '../models/projects';

import {SimpleUser} from '../core/models';
import {MatSnackBar} from '@angular/material';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {map} from 'rxjs/operators';
import {TasksFiltersService} from '../core/services/tasks-filters.service';
import * as _ from 'lodash';
import {IProjectApi} from '../models/project-api.interface';
import {toSnakeCase} from '../core/utils/toSnakeCase';
import {selectActiveProject, selectActiveProjectsIds, selectAllProjects} from '../core/selectors/projects.selectors';


@Injectable()
export class ProjectService {
    projects$: Observable<Project[]>;
    team: SimpleUser[];
    selectedProject$: Observable<Project>;
    selectedProjectsIds$: Observable<Array<Number>>;


    static sortProjectList(projects: Project[]): Project[] {
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

        this.projects$ = this.store.select(selectAllProjects);
        this.selectedProject$ = this.store.select(selectActiveProject);
        this.selectedProjectsIds$ = this.store.select(selectActiveProjectsIds);
    }

    loadProjects() {
        return this.http.get<IProjectApi[]>(`${environment['apiUrl']}/project/`)
            .pipe(
                map(payload => payload.map(project => new Project(project))),
            );
    }

    selectProject(project: Project | null) {
        // @TODO move to Efect

        // this.store.dispatch(new projectsAction.SelectProject(project));
        // this.store.dispatch(new tasksAction.DeleteNonFixedAssignedTo({}));
        if (project) {
            // project.shareWith.map((user: (SimpleUser | PendingUser)) => {
            //     if (user.hasOwnProperty('id') && user['id'] !== undefined && user['id'] !== parseInt(localStorage.getItem('USER_ID'), 10)) {
            //         // this.store.dispatch(new tasksAction.AddNewAssignedTo(
            //         //     new Filter({
            //         //         'id': user['id'],
            //         //         'label': 'assignedTo',
            //         //         'value': (task: Task) => task.owner.id === user['id'],
            //         //         'name': user.username
            //         //     })
            //         // ));
            //     }
            // });
            // this.tasksFiltersService.resetAssignedFilterToAssignedToAll();
        } else {
            // this.team.map((user) => {
            //     this.store.dispatch(new tasksAction.AddNewAssignedTo(
            //             new Filter({
            //                 'id': user.id,
            //                 'label': 'assignedTo',
            //                 'value': (task: Task) => task.owner.id === user.id,
            //                 'name': user.username
            //             })
            //         )
            //     );
            // });
            this.tasksFiltersService.resetAssignedFilterToAssignedToMe();
        }
    }

    saveProject(project: Project) {
        (project.id) ? this.updateProject(project) : this.createProject(project);
    }

    createProject(project: Project) {
        return this.http.post(`${environment['apiUrl']}/project/`, toSnakeCase(project))
            .pipe(map((payload: IProjectApi) => new Project(payload)));
            // .subscribe((payload: IProjectApi) => {
            //     this.snackBar.open('Project has been saved successfully', '', {
            //         duration: 2000,
            //     });
            //     const newProject = new Project(payload);
            //     this.store.dispatch(new projectsAction.CreateProject(newProject));
            //     this.router.navigate(['/home/projects', newProject.id]);
            //     this.loadProjects().subscribe(); // we need to update getAllDescendant set.
            // });
    }

    updateProject(project: Project, withoutSnackBar = false) {
        return this.http.put(`${environment['apiUrl']}/project/${project.id}/`, toSnakeCase(project));
            // .subscribe((payload: IProjectApi) => {
            //     this.store.dispatch(new projectsAction.UpdateProject(new Project(payload)));
            //     if (!withoutSnackBar) {
            //         this.snackBar.open('Project has been saved successfully', '', {
            //         duration: 2000,
            //         });
            //     }
            //     this.loadProjects().subscribe(); // we need to update getAllDescendant set.
            // });
    }


    deleteProject(projectId: number) {
        return this.http.delete(`${environment['apiUrl']}/project/${projectId}/`);
            // .subscribe(action => {
            //     this.store.dispatch(new projectsAction.DeleteProject(project));
            //     this.snackBar.open('Project has been deleted successfully', '', {
            //         duration: 2000,
            //     });
            // });
    }

    // selectProjectsIds(ids: Array<number>) {
    //     this.store.dispatch(new projectsAction.NewIds(ids));
    // }

    // updateElementFromSelectedProjectsIds(id: number) {
    //     this.store.dispatch(new projectsAction.AddNewId(id));
    // }
    //
    // deleteElementFromSelectedProjectsIds(id: number) {
    //     this.store.dispatch(new projectsAction.DeleteId(id));
    // }
}
