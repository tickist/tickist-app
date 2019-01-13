import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {TaskService} from '../services/task.service';
import {ActivatedRoute} from '@angular/router';
import {UserService} from '../services/user.service';
import {ProjectService} from '../services/project.service';
import {Observable, Subject, combineLatest} from 'rxjs';
import {Task} from '../models/tasks';
import {Project} from '../models/projects';
import {User} from '../user/models';
import {map, takeUntil} from 'rxjs/operators';
import {TasksFiltersService} from '../services/tasks-filters.service';
import {ConfigurationService} from '../services/configuration.service';

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
    tasksStream$: Observable<any>;
    selectedProjectsStream$: Observable<any>;
    taskView: string;
    tasks: Task[];
    user: User;
    defaultTaskView: string;
    selectedProject: Project;
    task_simple_view_value: string;
    task_extended_view_value: string;

    constructor(private taskService: TaskService, private route: ActivatedRoute, private userService: UserService,
                private projectService: ProjectService, private cd: ChangeDetectorRef, private configurationService: ConfigurationService,
                private tasksFiltersService: TasksFiltersService) {
    }

    ngOnInit() {
        this.task_simple_view_value = this.configurationService.TASK_SIMPLE_VIEW.value;
        this.task_extended_view_value = this.configurationService.TASK_EXTENDED_VIEW.value;
        this.tasksStream$ = combineLatest(
            this.taskService.tasks$,
            this.projectService.selectedProjectsIds$,
            this.tasksFiltersService.currentTasksFilters$
        );
        this.tasksStream$.pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe(([tasks, selectedProjectsIds, currentTasksFilters]) => {
            if (tasks && currentTasksFilters && currentTasksFilters.length > 0) {
                if (selectedProjectsIds) {
                    tasks = tasks.filter((task => selectedProjectsIds.indexOf(task.taskProject.id) > -1));
                }
                tasks = TasksFiltersService.useFilters(tasks, currentTasksFilters);
            }
            if (tasks && tasks.length > 0) {
                this.tasks = tasks;
                this.cd.markForCheck(); // marks path
            } else {
                this.tasks = [];
            }
        });
        this.selectedProjectsStream$ = combineLatest(
            this.route.params.pipe(map(params => params['projectId'])),
            this.projectService.projects$,
            this.userService.user$
        );
        this.selectedProjectsStream$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(([projectId, projects, user]) => {
            this.user = user;
            if (projectId && projects && projects.length > 0 && user) {
                const project = projects.filter(p => p.id === parseInt(projectId, 10))[0];
                if (project.hasOwnProperty('allDescendants')) {
                    this.projectService.selectProjectsIds(project.allDescendants);
                }
                this.projectService.selectProject(project);
            } else {
                this.projectService.selectProjectsIds(null);
                this.projectService.selectProject(null);
                this.defaultTaskView = user.allTasksView;
                this.taskView = user.allTasksView;
            }
        });
        this.projectService.selectedProject$.subscribe(project => {
            this.tasksListHeightFlex = this.TASKS_LIST_HEIGHT_WITHOUT_PROJECT_DESCRIPTION_FLEX;
            this.projectHeaderHeightFlex = this.PROJECT_HEADER_WITHOUT_DESCRIPTION_HEIGHT_FLEX;
            if (project) {
                this.selectedProject = project;
                this.defaultTaskView = project.taskView;
                this.taskView = project.taskView;
                if (project.hasDescription()) {
                    this.tasksListHeightFlex = this.TASKS_LIST_HEIGHT_WITH_PROJECT_DESCRIPTION_FLEX;
                    this.projectHeaderHeightFlex = this.PROJECT_HEADER_WITH_DESCRIPTION_HEIGHT_FLEX;
                }
            }
        });
    }

    changeTaskView(event) {
        this.taskView = event;
        if (this.selectedProject && this.selectedProject.taskView !== event) {
            this.selectedProject.taskView = event;
            this.projectService.updateProject(this.selectedProject, true);
        }
        if (!this.selectedProject && this.user.allTasksView !== event) {
            this.user.allTasksView = event;
            this.userService.updateUser(this.user, true);
        }
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    trackByFn(index, item): number {
        return item.id;
    }

}
