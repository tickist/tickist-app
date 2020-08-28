import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {combineLatest, Observable, Subject} from 'rxjs';
import {Task} from '@data/tasks/models/tasks';
import {Project} from '@data/projects';
import {User} from '@data/users/models';
import {filter, map, takeUntil} from 'rxjs/operators';
import {TasksFiltersService} from '../../../../core/services/tasks-filters.service';
import {NewActiveProjectsIds} from '../../../../core/actions/projects/active-projects-ids.actions';
import {Store} from '@ngrx/store';
import {SetActiveProject} from '../../../../core/actions/projects/active-project.actions';
import {selectActiveProject, selectAllProjects} from '../../../../core/selectors/projects.selectors';
import {selectTasksStreamInProjectsView} from '../../../../core/selectors/task.selectors';
import {UpdateUser} from '../../../../core/actions/user.actions';
import {editProjectSettingsRoutesName} from '../../../edit-project/routes-names';
import {UpdateProject} from '../../../../core/actions/projects/projects.actions';
import {selectLoggedInUser} from '../../../../core/selectors/user.selectors';
import {homeRoutesName} from '../../../../routing.module.name';
import {calculateProjectDescendants, hasProjectDescription, isProjectType} from '../../../../core/utils/projects-utils';
import {TASK_EXTENDED_VIEW} from "@data";

@Component({
    selector: 'tickist-tasks-from-projects',
    templateUrl: './tasks-from-projects.component.html',
    styleUrls: ['./tasks-from-projects.component.scss']
})
export class TasksFromProjectsComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    selectedProjectsStream$: Observable<any>;
    taskView: string;
    tasks$: Observable<Task[]>;
    user: User;
    defaultTaskView = TASK_EXTENDED_VIEW.value;
    selectedProject: Project;
    selectedProject$: Observable<Project>;

    constructor(private route: ActivatedRoute, private cd: ChangeDetectorRef,
                private tasksFiltersService: TasksFiltersService, private store: Store, private router: Router) {
    }

    ngOnInit() {
        this.tasks$ = this.store.select(selectTasksStreamInProjectsView)
        this.selectedProjectsStream$ = combineLatest([
            this.route.params.pipe(map(params => params['projectId'])),
            this.store.select(selectAllProjects),
            this.store.select(selectLoggedInUser),
            this.store.select(selectActiveProject)]
        );
        this.selectedProjectsStream$
            .pipe(
                filter(([, projects, user,]) => user && projects && projects.length > 0),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe(([projectId, projects, user, activeProject]) => {
                this.user = user;
                if (!isProjectType(projectId)) {
                    const project = projects.find(p => p.id === projectId);
                    if (project && project !== activeProject) {
                        const allDescendants = calculateProjectDescendants(project, projects);
                        this.store.dispatch(new NewActiveProjectsIds({projectsIds: allDescendants}));
                        this.store.dispatch(new SetActiveProject({project: project}));
                    }
                } else if (isProjectType(projectId)) {
                    const allProjectsIdsSelectedType = projects
                        .filter(project => project.projectType === projectId)
                        .map(project => project.id)
                    this.store.dispatch(new NewActiveProjectsIds({projectsIds: allProjectsIdsSelectedType}));
                    this.store.dispatch(new SetActiveProject({project: null}));

                } else {
                    this.store.dispatch(new NewActiveProjectsIds({projectsIds: []}));
                    this.store.dispatch(new SetActiveProject({project: null}));
                    this.defaultTaskView = user.allTasksView;
                    this.taskView = user.allTasksView;
                }

            });
        this.selectedProject$ = this.store.select(selectActiveProject);
        this.store.select(selectActiveProject).pipe(
            filter(project => !!project),
            takeUntil(this.ngUnsubscribe)
        ).subscribe(project => {
            this.defaultTaskView = project.taskView;
            this.taskView = project.taskView;
            this.cd.detectChanges();
        });
    }

    changeTaskView(event) {
        if (event) this.taskView = event;
        if (this.selectedProject && this.selectedProject.taskView !== event && event) {
            const project = Object.assign({}, this.selectedProject, {taskView: event});
            this.store.dispatch(new UpdateProject({project: {id: project.id, changes: project}}));
        }
        if (!this.selectedProject && this.user && this.user.allTasksView !== event && event) {
            const user = Object.assign({}, this.user, {allTasksView: event});
            this.store.dispatch(new UpdateUser({user}));
        }
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        this.cd.detach();
    }

    navigateToEditProjectView(projectId: string) {
        this.router.navigate([homeRoutesName.HOME, editProjectSettingsRoutesName.EDIT_PROJECT, projectId]);
    }

    hasProjectDescription(project) {
        return hasProjectDescription(project)
    }

    trackByFn(index, item): number {
        return item.id;
    }

}
