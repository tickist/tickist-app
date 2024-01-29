import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { combineLatest, Observable, Subject } from "rxjs";
import { Task } from "@data/tasks/models/tasks";
import { Project } from "@data/projects";
import { User } from "@data/users/models";
import { filter, map, takeUntil } from "rxjs/operators";
import { TasksFiltersService } from "../../../../core/services/tasks-filters.service";
import { Store } from "@ngrx/store";
import { selectActiveProject, selectAllProjects } from "../../../../core/selectors/projects.selectors";
import { selectTasksStreamInProjectsView } from "../../../../core/selectors/task.selectors";
import { updateUser } from "../../../../core/actions/user.actions";
import { editProjectSettingsRoutesName } from "../../../edit-project/routes-names";
import { updateProject } from "../../../../core/actions/projects/projects.actions";
import { selectLoggedInUser } from "../../../../core/selectors/user.selectors";
import { homeRoutesName } from "../../../../routing.module.name";
import { calculateProjectDescendants, hasProjectDescription, isProjectType } from "../../../../core/utils/projects-utils";
import { TASK_EXTENDED_VIEW } from "@data";
import { newActiveProjectsIds } from "../../../../core/actions/projects/active-projects-ids.actions";
import { setActiveProject } from "../../../../core/actions/projects/active-project.actions";
import { archiveRoutesName } from "../../../archives/routes.names";
import { selectSearchTasksTextIsEnabled } from "../../../../core/selectors/filters-tasks.selectors";
import { clearSearchTasksFilter } from "../../../../core/actions/tasks/search-tasks.actions";
import { AddTaskComponent } from "../../../../shared/components/add-task/add-task.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { NoTasksComponent } from "../../../../single-task/no-tasks/no-tasks.component";
import { SingleTaskComponent } from "../../../../single-task/single-task/single-task.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { DataCyDirective } from "../../../../shared/directives/data-cy.directive";
import { MenuButtonComponent } from "../../../../shared/components/menu-button/menu-button.component";
import { ChangeTaskViewComponent } from "../../../../shared/components/change-task-view-component/change-task-view.component";
import { FilterTasksComponent } from "../../../../tasks/filter-tasks/filter-tasks.component";
import { SortTasksComponent } from "../../../../tasks/sort-tasks/sort-tasks.component";
import { FlexModule } from "@ngbracket/ngx-layout/flex";
import { NgIf, AsyncPipe } from "@angular/common";
import { CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from "@angular/cdk/scrolling";

@Component({
    selector: "tickist-tasks-from-projects",
    templateUrl: "./tasks-from-projects.component.html",
    styleUrls: ["./tasks-from-projects.component.scss"],
    standalone: true,
    imports: [
        CdkVirtualScrollViewport,
        CdkFixedSizeVirtualScroll,
        NgIf,
        FlexModule,
        SortTasksComponent,
        FilterTasksComponent,
        ChangeTaskViewComponent,
        MenuButtonComponent,
        DataCyDirective,
        MatTooltipModule,
        RouterLink,
        CdkVirtualForOf,
        SingleTaskComponent,
        NoTasksComponent,
        FaIconComponent,
        AddTaskComponent,
        AsyncPipe,
    ],
})
export class TasksFromProjectsComponent implements OnInit, OnDestroy {
    selectedProjectsStream$: Observable<any>;
    taskView: string;
    tasks$: Observable<Task[]>;
    isSearchFilterEnabled$: Observable<boolean>;
    user: User;
    defaultTaskView = TASK_EXTENDED_VIEW.value;
    selectedProject: Project;
    selectedProject$: Observable<Project>;
    isSharedProject: boolean;
    archiveRoutesName = archiveRoutesName.archive;
    homeRoutesName = "/" + homeRoutesName.home;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    constructor(
        private route: ActivatedRoute,
        private cd: ChangeDetectorRef,
        private tasksFiltersService: TasksFiltersService,
        private store: Store,
        private router: Router
    ) {}

    ngOnInit() {
        this.tasks$ = this.store.select(selectTasksStreamInProjectsView);
        this.isSearchFilterEnabled$ = this.store.select(selectSearchTasksTextIsEnabled);
        this.selectedProjectsStream$ = combineLatest([
            this.route.params.pipe(map((params) => params["projectId"])),
            this.store.select(selectAllProjects),
            this.store.select(selectLoggedInUser),
            this.store.select(selectActiveProject),
        ]);
        this.selectedProjectsStream$
            .pipe(
                filter(([, projects, user]) => user && projects && projects.length > 0),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe(([projectId, projects, user, activeProject]) => {
                this.user = user;
                if (!isProjectType(projectId)) {
                    const project = projects.find((p) => p.id === projectId);
                    if (project && project !== activeProject) {
                        const allDescendants = calculateProjectDescendants(project, projects);
                        this.store.dispatch(
                            newActiveProjectsIds({
                                projectsIds: allDescendants,
                            })
                        );
                        this.store.dispatch(setActiveProject({ project: project }));
                    }
                } else if (isProjectType(projectId)) {
                    const allProjectsIdsSelectedType = projects
                        .filter((project) => project.projectType === projectId)
                        .map((project) => project.id);
                    this.store.dispatch(
                        newActiveProjectsIds({
                            projectsIds: allProjectsIdsSelectedType,
                        })
                    );
                    this.store.dispatch(setActiveProject({ project: null }));
                } else {
                    this.store.dispatch(newActiveProjectsIds({ projectsIds: [] }));
                    this.store.dispatch(setActiveProject({ project: null }));
                    this.defaultTaskView = user.allTasksView;
                    this.taskView = user.allTasksView;
                }
            });
        this.selectedProject$ = this.store.select(selectActiveProject);
        this.store
            .select(selectActiveProject)
            .pipe(
                filter((project) => !!project),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((project) => {
                this.defaultTaskView = project.taskView;
                this.taskView = project.taskView;
                this.isSharedProject = project.shareWithIds.length > 1;
                this.cd.detectChanges();
            });
    }

    changeTaskView(event) {
        if (event) this.taskView = event;
        if (this.selectedProject && this.selectedProject.taskView !== event && event) {
            const project = Object.assign({}, this.selectedProject, {
                taskView: event,
            });
            this.store.dispatch(updateProject({ project: { id: project.id, changes: project } }));
        }
        if (!this.selectedProject && this.user && this.user.allTasksView !== event && event) {
            const user = Object.assign({}, this.user, { allTasksView: event });
            this.store.dispatch(updateUser({ user }));
        }
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        this.cd.detach();
    }

    navigateToEditProjectView(projectId: string) {
        this.router.navigate([homeRoutesName.home, editProjectSettingsRoutesName.editProject, projectId]);
    }

    hasProjectDescription(project) {
        return hasProjectDescription(project);
    }

    trackByFn(index, item): number {
        return item.id;
    }

    clearSearchFilter() {
        this.store.dispatch(clearSearchTasksFilter());
    }
}
