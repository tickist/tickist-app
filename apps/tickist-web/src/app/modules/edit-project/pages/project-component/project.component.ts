import { Component, HostListener, OnDestroy, OnInit, ViewChild } from "@angular/core";
import {
    DEFAULT_PRIORITY,
    DEFAULT_TYPE_FINISH_DATE,
    InviteUser,
    InviteUserStatus,
    Project,
    ProjectType,
    ShareWithUser,
} from "@data/projects";
import { Location, NgIf, NgClass, NgFor, NgStyle, AsyncPipe } from "@angular/common";
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { combineLatest, Observable, Subject, Subscription } from "rxjs";
import { ConfigurationService } from "../../../../core/services/configuration.service";
import { ActivatedRoute, Router } from "@angular/router";
import { SimpleUser, User } from "@data/users/models";
import { MatDialog } from "@angular/material/dialog";
import { filter, map, startWith, takeUntil } from "rxjs/operators";
import { requestCreateProject, requestUpdateProject } from "../../../../core/actions/projects/projects.actions";
import { Store } from "@ngrx/store";
import { selectAllProjectsWithLevelAndTreeStructures } from "../../../../core/selectors/projects.selectors";
import { selectLoggedInUser } from "../../../../core/selectors/user.selectors";
import { selectTeam } from "../../../../core/selectors/team.selectors";
import { DEFAULT_USER_AVATAR } from "@data/users/config-user";
import { DeleteUserConfirmationDialogComponent } from "../../components/delete-user-confirmation-dialog/delete-user-confirmation-dialog.component";
import { addClickableLinks } from "@tickist/utils";
import { ProjectService } from "../../../../core/services/project.service";
import { TASKS_VIEWS_LIST } from "@data";
import { hideAddTaskButton, showAddTaskButton } from "../../../../core/actions/add-task-button-visibility.actions";
import { IconPickerComponent } from "../../components/icon-picker/icon-picker.component";
import { ColorPickerComponent } from "../../components/color-picker/color-picker.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { UserAvatarComponent } from "../../../../shared/components/user-avatar/user-avatar.component";
import { MatButtonModule } from "@angular/material/button";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatRadioModule } from "@angular/material/radio";
import { PriorityComponent } from "../../../../shared/components/priority/priority.component";
import { MatOptionModule } from "@angular/material/core";
import { DataCyDirective } from "../../../../shared/directives/data-cy.directive";
import { MatSelectModule } from "@angular/material/select";
import { A11yModule } from "@angular/cdk/a11y";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ExtendedModule } from "@ngbracket/ngx-layout/extended";
import { MatListModule } from "@angular/material/list";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { FlexModule } from "@ngbracket/ngx-layout/flex";
import { MatCardModule } from "@angular/material/card";

@Component({
    selector: "tickist-project",
    templateUrl: "./project.component.html",
    styleUrls: ["./project.component.scss"],
    standalone: true,
    imports: [
        MatCardModule,
        FlexModule,
        NgIf,
        FormsModule,
        ReactiveFormsModule,
        FaIconComponent,
        MatListModule,
        NgClass,
        ExtendedModule,
        MatFormFieldModule,
        MatInputModule,
        A11yModule,
        MatSelectModule,
        DataCyDirective,
        NgFor,
        MatOptionModule,
        PriorityComponent,
        MatRadioModule,
        NgStyle,
        MatCheckboxModule,
        MatAutocompleteModule,
        MatButtonModule,
        UserAvatarComponent,
        MatProgressSpinnerModule,
        MatTooltipModule,
        ColorPickerComponent,
        IconPickerComponent,
        AsyncPipe,
    ],
})
export class ProjectComponent implements OnInit, OnDestroy {
    @ViewChild("auto") auto: any;
    @ViewChild("matAutocomplete") matAutocomplete: any;
    enter = "Enter";
    project: Project;
    projects: Project[];
    ancestorProjectId: number;
    defaultAvatarUrl: string;
    projectsAncestors: Project[] | any[];
    stream$: Observable<any>;
    projectForm: UntypedFormGroup;
    menu: any;
    user: User;
    team: SimpleUser[];
    defaultTaskView: any;
    typeFinishDateOptions: any;
    defaultFinishDateOptions: any;
    deleteOrLeaveProjectLabel = "";
    colors: any;
    filteredUsers: any;
    addUserToShareWithListCtrl: UntypedFormControl;
    subscription: Subscription;
    submitButtonLabel: string;
    defaultUserAvatar = DEFAULT_USER_AVATAR;
    shareWith: ShareWithUser[];
    usersWithoutAccount: InviteUser[];
    userWithoutAccountStatus = InviteUserStatus;
    icon$: Observable<any>;
    color$: Observable<any>;
    projectTypes: ProjectType[];
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private fb: UntypedFormBuilder,
        private route: ActivatedRoute,
        private store: Store,
        private location: Location,
        public dialog: MatDialog,
        private configurationService: ConfigurationService,
        private router: Router,
        private projectService: ProjectService,
    ) {
        this.addUserToShareWithListCtrl = new UntypedFormControl();
        this.menu = this.createMenuDict();
    }

    @HostListener("window:keyup", ["$event"])
    keyEvent(event: KeyboardEvent) {
        if (event.key === this.enter && this.checkActiveItemInMenu("sharing")) {
            this.inviteUser();
        }
    }

    ngOnInit() {
        this.typeFinishDateOptions = this.configurationService.configuration.commons.typeFinishDateOptions;
        this.defaultFinishDateOptions = this.configurationService.configuration.commons.choicesDefaultFinishDate;
        this.defaultTaskView = TASKS_VIEWS_LIST;
        this.colors = this.configurationService.configuration.commons.colorList;
        this.route.params
            .pipe(
                map((params) => params["ancestorProjectId"]),
                takeUntil(this.ngUnsubscribe),
            )
            .subscribe((ancestorProjectId) => {
                this.ancestorProjectId = ancestorProjectId;
            });
        this.stream$ = combineLatest([
            this.store.select(selectAllProjectsWithLevelAndTreeStructures),
            this.route.params.pipe(map((params) => params["projectId"])),
            this.store.select(selectLoggedInUser),
            this.store.select(selectTeam),
        ]);
        this.subscription = this.stream$
            .pipe(
                filter(([projects, , user]) => projects.length > 0 && user),
                takeUntil(this.ngUnsubscribe),
            )
            .subscribe(([projects, projectId, user, team]) => {
                let project: Project;
                this.user = user;
                this.team = team;
                this.projectsAncestors = [
                    { id: "", name: "No ancestor project" },
                    ...projects.filter((p) => p.level < 2).filter((p) => p.id !== projectId),
                ];
                if (projectId) {
                    project = projects.find((p) => p.id === projectId);
                    this.projectForm = this.createForm(project);
                } else {
                    project = this.createNewProject();
                    this.projectForm = this.createForm(project);
                }
                if (this.user.id === project.owner) {
                    this.deleteOrLeaveProjectLabel = "Delete project";
                } else {
                    this.deleteOrLeaveProjectLabel = "Leave project";
                }
                this.project = project;
                this.shareWith = project.shareWith.filter((shareWithUser) => shareWithUser.id !== user.id);
                this.usersWithoutAccount = project.inviteUserByEmail;
                this.submitButtonLabel = this.isNewProject() ? "Create" : "Save";
                if (this.projectForm) {
                    this.icon$ = this.projectForm
                        .get("branding")
                        .get("icon")
                        .valueChanges.pipe(
                            startWith(this.project.icon),
                            filter((value) => !!value),
                            takeUntil(this.ngUnsubscribe),
                        );
                    this.color$ = this.projectForm
                        .get("branding")
                        .get("color")
                        .valueChanges.pipe(
                            startWith(this.project.color),
                            filter((value) => !!value),
                            takeUntil(this.ngUnsubscribe),
                        );
                    this.projectForm
                        .get("main")
                        .get("ancestor")
                        .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                        .subscribe((value) => {
                            if (value) {
                                this.projectForm.get("main").get("projectType").disable();
                            } else {
                                this.projectForm.get("main").get("projectType").enable();
                            }
                        });
                }
                if (project.projectType === ProjectType.inbox) {
                    this.projectTypes = [ProjectType.inbox];
                } else {
                    this.projectTypes = [ProjectType.active, ProjectType.routineReminder, ProjectType.maybe];
                }
            });
        this.addUserToShareWithListCtrl = new UntypedFormControl("", Validators.compose([Validators.required, Validators.email]));
        this.filteredUsers = this.addUserToShareWithListCtrl.valueChanges.pipe(
            startWith(""),
            map((name) => this.filterUsers(name)),
        );
        this.store.dispatch(hideAddTaskButton());
    }

    ngOnDestroy() {
        this.store.dispatch(showAddTaskButton());
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    createMenuDict() {
        return [
            {
                name: "main",
                isActive: true,
                id: 1,
            },
            {
                name: "extra",
                isActive: false,
                id: 5,
            },
            {
                name: "sharing",
                isActive: false,
                id: 3,
            },
            {
                name: "branding",
                isActive: false,
                id: 4,
            },
        ];
    }

    changeActiveItemInMenu(name): void {
        this.menu.forEach((item) => (item.isActive = false));
        this.menu.find((item) => item.name === name).isActive = true;
    }

    checkActiveItemInMenu(name): boolean {
        return this.menu.find((item) => item.name === name).isActive;
    }

    onSubmit(values) {
        if (this.projectForm.valid) {
            const project = Object.assign({}, this.project);
            project.name = values["main"]["name"];
            project.description = values["main"]["description"];
            project.richDescription = addClickableLinks(values["main"]["description"]);
            project.ancestor = values["main"]["ancestor"];
            project.projectType = values["main"]["projectType"];
            project.color = values["branding"]["color"];
            project.defaultFinishDate = values["extra"]["defaultFinishDate"];
            project.defaultPriority = values["extra"]["defaultPriority"];
            project.defaultTypeFinishDate = values["extra"]["defaultTypeFinishDate"];
            project.defaultTypeFinishDate = values["extra"]["defaultTypeFinishDate"];
            project.taskView = values["extra"]["taskView"];
            project.dialogTimeWhenTaskFinished = values["extra"]["dialogTimeWhenTaskFinished"];
            project.icon = values["branding"]["icon"];
            // @TODO maybe whole object instead of ID

            // if (project.ancestor) {
            //     this.updateAncestorProject(project.ancestor);
            // }
            // List share with is added directly

            if (this.isNewProject()) {
                this.store.dispatch(requestCreateProject({ project: project }));
            } else {
                this.store.dispatch(
                    requestUpdateProject({
                        project: { id: project.id, changes: project },
                    }),
                );
            }
            this.close();
        }
    }

    close() {
        // DRY
        this.location.back();
    }

    // updateAncestorProject(ancestorProjectId) {
    //     const ancestorProject = this.projectsAncestors.find(project => project.id === ancestorProjectId);
    //
    // }

    createForm(project: Project) {
        return new UntypedFormGroup({
            main: new UntypedFormGroup({
                name: new UntypedFormControl(project.name, {
                    validators: Validators.required,
                }),
                projectType: new UntypedFormControl(project.projectType, {
                    validators: Validators.required,
                }),
                ancestor: new UntypedFormControl(project.ancestor),
                description: new UntypedFormControl(project.description),
            }),
            extra: new UntypedFormGroup({
                defaultFinishDate: new UntypedFormControl(project.defaultFinishDate),
                defaultPriority: new UntypedFormControl(project.defaultPriority),
                defaultTypeFinishDate: new UntypedFormControl(project.defaultTypeFinishDate),
                dialogTimeWhenTaskFinished: new UntypedFormControl(project.dialogTimeWhenTaskFinished),
                taskView: new UntypedFormControl(project.taskView),
            }),
            branding: new UntypedFormGroup({
                color: new UntypedFormControl(project.color),
                icon: new UntypedFormControl(project.icon),
            }),
        });
    }

    createNewProject() {
        return new Project({
            name: "",
            description: "",
            ancestor: this.ancestorProjectId ? this.ancestorProjectId : null,
            defaultPriority: DEFAULT_PRIORITY,
            defaultTypeFinishDate: DEFAULT_TYPE_FINISH_DATE,
            defaultTaskView: this.user.defaultTaskView,
            owner: this.user.id,
            isActive: true,
            shareWith: [
                {
                    id: this.user.id,
                    email: this.user.email,
                    username: this.user.username,
                    avatarUrl: this.user.avatarUrl,
                },
            ],
            shareWithIds: [this.user.id],
            tags: [],
            dialogTimeWhenTaskFinished: this.user.dialogTimeWhenTaskFinishedInProject,
        });
    }

    removeUserFromShareWithList(user: ShareWithUser) {
        const title = "Confirmation";
        const content = `If you are sure you want to remove  ${user.username} from the shared list ${this.project.name},
                          click Yes. All tasks assigned to this person will be moved to her/his Inbox.`;

        const dialogRef = this.dialog.open(DeleteUserConfirmationDialogComponent);
        dialogRef.componentInstance.setTitle(title);
        dialogRef.componentInstance.setContent(content);
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((result) => {
                if (result) {
                    this.projectService.removeUserFormShareWithList(this.project, user);
                }
            });
    }

    filterUsers(val): any {
        if (val) {
            const userIds = this.project.shareWith.map((u) => u.id);

            if (this.addUserToShareWithListCtrl.hasError("pattern") || this.addUserToShareWithListCtrl.hasError("required")) {
                return [{ id: "", email: "Please write a valid email" }];
            } else {
                return [
                    ...this.team.filter((u) => !userIds.includes(u.id)).filter((u) => new RegExp(val, "gi").test(u.email)),
                    { email: val },
                ];
            }
        }
        return [];
    }

    inviteUser() {
        if (this.addUserToShareWithListCtrl.valid) {
            this.projectService.addUserToProject(this.project, this.addUserToShareWithListCtrl.value);
        } else {
            this.addUserToShareWithListCtrl.markAsDirty();
        }
    }

    deleteUserFromInviteList(user) {
        this.projectService.deleteUserFromInviteList(this.project, user);
    }

    ancestorChange($event) {
        if ($event.value) {
            const ancestorProjectType = this.projectsAncestors.find((project) => project.id === $event.value).projectType;
            this.projectForm.get("main").get("projectType").setValue(ancestorProjectType, { emitEvent: false });
        }
    }

    isNewProject(): boolean {
        return !this.project.id;
    }
}
