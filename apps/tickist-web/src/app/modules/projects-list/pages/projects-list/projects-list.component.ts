import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable, Subject } from "rxjs";
import { TaskService } from "../../../../core/services/task.service";
import { ProjectType } from "@data/projects";
import { ConfigurationService } from "../../../../core/services/configuration.service";
import { User } from "@data/users/models";
import { UserService } from "../../../../core/services/user.service";
import { MediaObserver } from "@ngbracket/ngx-layout";
import { MatDialog } from "@angular/material/dialog";
import { FilterProjectDialogComponent } from "../../components/filter-projects-dialog/filter-projects.dialog.component";
import { ProjectsFiltersService } from "../../projects-filters.service";
import { Store } from "@ngrx/store";
import { tasksProjectsViewRoutesName } from "../../../tasks-projects-view/routes.names";
import { editProjectSettingsRoutesName } from "../../../edit-project/routes-names";
import { selectFilteredProjectsList } from "../../projects-filters.selectors";
import { homeRoutesName } from "../../../../routing.module.name";
import { Filter } from "@data/filter";
import { takeUntil } from "rxjs/operators";
import { ProjectLeftPanel } from "../../models/project-list";

@Component({
    selector: "tickist-projects-list",
    templateUrl: "./projects-list.component.html",
    styleUrls: ["./projects-list.component.scss"],
})
export class ProjectsListComponent implements OnInit, OnDestroy {
    @Input() projectType: ProjectType;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    user: User;
    showOnlyProjectsWithTasks = true;
    filter: Filter;
    tasksProjectsViewRoutingName = tasksProjectsViewRoutesName.tasksProjectsView;
    projectsList$: Observable<ProjectLeftPanel[]>;

    constructor(
        private taskService: TaskService,
        private projectsFiltersService: ProjectsFiltersService,
        private store: Store,
        private route: ActivatedRoute,
        private userService: UserService,
        private configurationService: ConfigurationService,
        private router: Router,
        private media: MediaObserver,
        private cd: ChangeDetectorRef,
        public dialog: MatDialog
    ) {}

    ngOnInit() {
        this.projectsList$ = this.store.select(selectFilteredProjectsList(this.projectType));
    }

    toggleProjectView() {
        this.showOnlyProjectsWithTasks = !this.showOnlyProjectsWithTasks;
    }

    trackByFn(index, item) {
        return item.id;
    }

    navigateToAllProjects(path) {
        this.router.navigate([homeRoutesName.home, path, this.projectType]);
        if (this.media.isActive("sm") || this.media.isActive("xs")) {
            this.configurationService.changeOpenStateLeftSidenavVisibility("close");
        }
    }

    openFilterDialog() {
        const dialogRef = this.dialog.open(FilterProjectDialogComponent);
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((result) => {
                if (result) {
                }
            });
    }

    navigateToCreateProjectView() {
        this.router.navigate(["home", editProjectSettingsRoutesName.editProject]);
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        this.cd.detach();
    }
}
