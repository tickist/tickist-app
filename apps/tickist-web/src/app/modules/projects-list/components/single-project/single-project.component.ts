import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    Input,
    OnDestroy,
    OnInit,
    ViewChild,
} from "@angular/core";
import { AVAILABLE_PROJECT_TYPES, ProjectType, ProjectWithAllDescendants } from "@data/projects";
import { ProjectService } from "../../../../core/services/project.service";
import { Router, RouterLink } from "@angular/router";
import { ConfigurationService } from "../../../../core/services/configuration.service";
import { MediaObserver } from "@ngbracket/ngx-layout";
import { DeleteProjectConfirmationDialogComponent } from "../delete-project-dialog/delete-project-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { User } from "@data/users/models";
import { Store } from "@ngrx/store";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { tasksProjectsViewRoutesName } from "../../../tasks-projects-view/routes.names";
import { editProjectSettingsRoutesName } from "../../../edit-project/routes-names";
import { selectActiveProjectsIds, selectActiveProjectWithAllDescendants } from "../../../../core/selectors/projects.selectors";
import { selectLoggedInUser } from "../../../../core/selectors/user.selectors";
import { requestDeleteProject, requestUpdateProject } from "../../../../core/actions/projects/projects.actions";
import { homeRoutesName } from "../../../../routing.module.name";
import { ProjectLeftPanel } from "../../models/project-list";
import { addNewActiveProjectId, deleteActiveProjectId } from "../../../../core/actions/projects/active-projects-ids.actions";
import { NGXLogger } from "ngx-logger";
import { MatMenuModule } from "@angular/material/menu";
import { DataCyDirective } from "../../../../shared/directives/data-cy.directive";
import { MenuButtonComponent } from "../../../../shared/components/menu-button/menu-button.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AngularResizeEventModule } from "angular-resize-event";
import { FormsModule } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { ExtendedModule } from "@ngbracket/ngx-layout/extended";
import { NgClass, NgIf, NgStyle, NgFor } from "@angular/common";
import { FlexModule } from "@ngbracket/ngx-layout/flex";

@Component({
    selector: "tickist-single-project",
    templateUrl: "./single-project.component.html",
    styleUrls: ["./single-project.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        FlexModule,
        NgClass,
        ExtendedModule,
        NgIf,
        FaIconComponent,
        NgStyle,
        MatCheckboxModule,
        FormsModule,
        AngularResizeEventModule,
        MatTooltipModule,
        MenuButtonComponent,
        DataCyDirective,
        MatMenuModule,
        NgFor,
        RouterLink,
    ],
})
export class SingleProjectComponent implements OnInit, OnDestroy {
    @Input() project: ProjectLeftPanel;
    @Input() isSmallScreen: boolean;
    @ViewChild("projectNameDiv") el: ElementRef;
    selectedProject$: Observable<ProjectWithAllDescendants>;
    selectedProjectsIds$: Observable<Array<string>>;
    isActive = false;
    activeCheckboxMode = false;
    isSelected = false;
    isMenuVisible = false;
    isFastMenuVisible = false;
    isMouseOver = false;
    deleteOrLeave = "";
    user: User;
    availableProjectTypes = AVAILABLE_PROJECT_TYPES;
    anotherProjectTypes: ProjectType[];
    homeRoutesName = "/" + homeRoutesName.home;
    editProjectSettingsRoutesName = editProjectSettingsRoutesName.editProject;
    canHaveChildProjects: boolean;
    tooltip = false;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    constructor(
        private projectService: ProjectService,
        protected router: Router,
        public dialog: MatDialog,
        protected configurationService: ConfigurationService,
        protected media: MediaObserver,
        private store: Store,
        private cd: ChangeDetectorRef,
        private logger: NGXLogger
    ) {}

    @HostListener("mouseenter")
    onMouseEnter() {
        this.isMouseOver = true;
        this.changeMenuVisiblity();
        this.isMenuVisible = true;
    }

    @HostListener("mouseleave")
    onMouseLeave() {
        this.isMouseOver = false;
        this.changeMenuVisiblity();
        if (!this.isFastMenuVisible) {
            this.isMenuVisible = false;
        }
    }

    ngOnInit() {
        this.anotherProjectTypes = this.availableProjectTypes.filter((projectType) => projectType !== this.project.projectType);
        this.deleteOrLeave = this.project.shareWith.length > 1 ? "Leave" : "Delete";
        this.canHaveChildProjects = this.project.level < 2;
        this.store
            .select(selectLoggedInUser)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((user) => {
                this.user = user;
            });
        this.selectedProject$ = this.store.select(selectActiveProjectWithAllDescendants);
        this.selectedProject$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((project) => {
            if (project && project.allDescendants.indexOf(this.project.id) > -1) {
                this.isSelected = true;
                if (project.allDescendants.length > 1) {
                    this.activeCheckboxMode = true;
                }
            } else {
                this.isSelected = false;
                this.activeCheckboxMode = false;
            }
            this.cd.detectChanges();
        });
        this.selectedProjectsIds$ = this.store.select(selectActiveProjectsIds);
        this.selectedProjectsIds$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((ids) => {
            this.isActive = ids && ids.indexOf(this.project.id) > -1;
            this.cd.detectChanges();
        });
    }

    onResized() {
        if (this.el.nativeElement.offsetWidth < this.el.nativeElement.scrollWidth && !this.tooltip) {
            this.tooltip = true;
            this.cd.detectChanges();
        } else if (this.el.nativeElement.offsetWidth >= this.el.nativeElement.scrollWidth && this.tooltip) {
            this.tooltip = false;
            this.cd.detectChanges();
        }
    }

    changeMenuVisiblity() {
        if (this.isMouseOver) {
            this.isMenuVisible = true;
        }
        if (!this.isMouseOver && this.isFastMenuVisible) {
            this.isMenuVisible = true;
        }
        if (!this.isMouseOver && !this.isFastMenuVisible) {
            this.isMenuVisible = false;
        }
    }

    changeFastMenuVisible(value) {
        this.isFastMenuVisible = value;
        this.changeMenuVisiblity();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    changeId() {
        if (this.isActive) {
            this.store.dispatch(addNewActiveProjectId({ projectId: this.project.id }));
        } else {
            this.store.dispatch(deleteActiveProjectId({ projectId: this.project.id }));
        }
    }

    convertTo(projectType) {
        this.store.dispatch(
            requestUpdateProject({
                project: {
                    id: this.project.id,
                    changes: Object.assign({}, this.project, { projectType }),
                },
            })
        );
    }

    deleteOrLeaveProject() {
        let content;
        let title;
        if (this.user.id === this.project.owner) {
            title = "Delete project";
            if (this.project.shareWith.length > 1) {
                content = `If you are sure you want to delete the shared project
                ${this.project.name}, click Yes. All tasks assigned to you will
                be deleted and tasks assigned to others will be moved to their Inbox folder.`;
            } else {
                content = `If you are sure you want to delete the project ${this.project.name} and all tasks from this project, click Yes.`;
            }
        } else {
            title = "Delete project";
            content = `If you are sure you want to leave the shared project ${this.project.name} click Continue.
                        All tasks assigned to you will be deleted.`;
        }

        const dialogRef = this.dialog.open(DeleteProjectConfirmationDialogComponent);
        dialogRef.componentInstance.setTitle(title);
        dialogRef.componentInstance.setContent(content);
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((result) => {
                if (result) {
                    this.store.dispatch(requestDeleteProject({ projectId: this.project.id }));
                    this.router.navigate(["home", tasksProjectsViewRoutesName.tasksProjectsView, this.user.inboxPk]);
                }
            });
    }

    navigateToEditProjectView(projectId: string) {
        this.router.navigate([homeRoutesName.home, editProjectSettingsRoutesName.editProject, projectId]);
    }

    navigateTo(path, projectId, $event) {
        const elementClickPath = $event.path || ($event.composedPath && $event.composedPath());
        const mdCheckbox = elementClickPath.find((elem) => elem.localName === "mat-checkbox");
        if (!mdCheckbox) {
            this.router.navigate(["home", tasksProjectsViewRoutesName.tasksProjectsView, projectId]).catch((err) => this.logger.error(err));
            if (this.media.isActive("sm") || this.media.isActive("xs")) {
                this.configurationService.changeOpenStateLeftSidenavVisibility("close");
            }
        }
    }
}
