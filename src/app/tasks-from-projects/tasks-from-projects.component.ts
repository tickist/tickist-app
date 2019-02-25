import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {TaskService} from '../tasks/task.service';
import {ActivatedRoute} from '@angular/router';
import {UserService} from '../user/user.service';
import {ProjectService} from '../services/project.service';
import {Observable, Subject, combineLatest} from 'rxjs';
import {Task} from '../models/tasks';
import {Project} from '../models/projects';
import {User} from '../user/models';
import {map, takeUntil} from 'rxjs/operators';
import {TasksFiltersService} from '../tasks/tasks-filters.service';
import {ConfigurationService} from '../services/configuration.service';
import {NewActiveProjectsIds} from '../projects/active-projects-ids.actions';
import {Store} from '@ngrx/store';
import {AppStore} from '../store';
import {SetActiveProject} from '../projects/active-project.actions';
import {selectActiveProject, selectAllProjects} from '../projects/projects.selectors';
import {selectTasksStreamInProjectsView} from '../tasks/task.selectors';
import {UpdateUser} from '../user/user.actions';

@Component({
    selector: 'tickist-tasks-from-projects',
    templateUrl: './tasks-from-projects.component.html',
    styleUrls: ['./tasks-from-projects.component.scss']
})
export class TasksFromProjectsComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    readonly TASKS_LIST_HEIGHT_WITH_PROJECT_DESCRIPTION_FLEX = 80;
    readonly TASKS_LIST_HEIGHT_WITHOUT_PROJECT_DESCRIPTION_FLEX = 'auto';
    readonly PROJECT_HEADER_WITH_DESCRIPTION_HEIGHT_FLEX = 20;
    readonly PROJECT_HEADER_WITHOUT_DESCRIPTION_HEIGHT_FLEX = 'auto';
    tasksListHeightFlex: number | string;
    projectHeaderHeightFlex: number | string;
    selectedProjectsStream$: Observable<any>;
    taskView: string;
    tasks: Task[] = [];
    user: User;
    defaultTaskView: string;
    selectedProject: Project;
    task_simple_view_value: string;
    task_extended_view_value: string;

    constructor(private taskService: TaskService, private route: ActivatedRoute, private userService: UserService,
                private projectService: ProjectService, private cd: ChangeDetectorRef, private configurationService: ConfigurationService,
                private tasksFiltersService: TasksFiltersService, private store: Store<AppStore>) {
    }

    ngOnInit() {
        this.store.select(selectTasksStreamInProjectsView)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(tasks => {
                this.tasks = tasks;
                this.cd.detectChanges();
            });
        this.task_simple_view_value = this.configurationService.TASK_SIMPLE_VIEW.value;
        this.task_extended_view_value = this.configurationService.TASK_EXTENDED_VIEW.value;
        this.defaultTaskView = this.configurationService.TASK_EXTENDED_VIEW.value;
        this.selectedProjectsStream$ = combineLatest(
            this.route.params.pipe(map(params => params['projectId'])),
            this.store.select(selectAllProjects),
            this.userService.user$
        );
        this.selectedProjectsStream$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(([projectId, projects, user]) => {
                this.user = user;
                if (projectId && projects && projects.length > 0 && user) {
                    const project = projects.find(p => p.id === parseInt(projectId, 10));
                    if (project.hasOwnProperty('allDescendants')) {
                        this.store.dispatch(new NewActiveProjectsIds({projectsIds: project.allDescendants}));
                    }
                    this.store.dispatch(new SetActiveProject({project: project}));
                } else {
                    this.store.dispatch(new NewActiveProjectsIds({projectsIds: []}));
                    this.store.dispatch(new SetActiveProject({project: undefined}));
                    this.defaultTaskView = user.allTasksView;
                    this.taskView = user.allTasksView;
                }
            });
        this.store.select(selectActiveProject).subscribe(project => {
            this.tasksListHeightFlex = this.TASKS_LIST_HEIGHT_WITHOUT_PROJECT_DESCRIPTION_FLEX;
            this.projectHeaderHeightFlex = this.PROJECT_HEADER_WITHOUT_DESCRIPTION_HEIGHT_FLEX;
            if (project) {
                this.selectedProject = project;
                this.defaultTaskView = project.taskView;
                this.taskView = project.taskView;
                if (this.projectHasDescription(project)) {
                    this.tasksListHeightFlex = this.TASKS_LIST_HEIGHT_WITH_PROJECT_DESCRIPTION_FLEX;
                    this.projectHeaderHeightFlex = this.PROJECT_HEADER_WITH_DESCRIPTION_HEIGHT_FLEX;
                }
            }
        });
    }

    changeTaskView(event) {
        if (event) this.taskView = event;
        if (this.selectedProject && this.selectedProject.taskView !== event && event) {
            this.selectedProject.taskView = event;
            this.projectService.updateProject(this.selectedProject, true);
        }
        if (!this.selectedProject && this.user && this.user.allTasksView !== event && event) {
            this.user.allTasksView = event;
            this.store.dispatch(new UpdateUser({user: this.user}));
        }
    }

    projectHasDescription(project) {
        return project.description && project.description.length > 0;
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        this.cd.detach();
    }

    trackByFn(index, item): number {
        return item.id;
    }

}
