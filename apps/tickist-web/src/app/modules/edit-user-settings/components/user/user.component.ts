import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { User } from "@data/users/models";
import { UserService } from "../../../../core/services/user.service";
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { Location } from "@angular/common";
import { ConfigurationService } from "../../../../core/services/configuration.service";
import { environment } from "../../../../../environments/environment";
import { MyErrorStateMatcher } from "../../../../shared/error-state-matcher";
import { Subject } from "rxjs";
import { filter, takeUntil } from "rxjs/operators";
import { Store } from "@ngrx/store";
import { selectLoggedInUser } from "../../../../core/selectors/user.selectors";
import { changeAvatar, removeNotificationPermission, requestUpdateUser } from "../../../../core/actions/user.actions";
import { DEFAULT_DAILY_SUMMARY_HOUR, DEFAULT_USER_AVATAR, TASKS_ORDER_OPTIONS } from "@data/users/config-user";
import { NotificationPermission, TASKS_VIEWS_LIST } from "@data";
import { NotificationsService } from "../../../notifications/services/notifications.service";
import { hideAddTaskButton, showAddTaskButton } from "../../../../core/actions/add-task-button-visibility.actions";
import { DeleteAccountDialogComponent } from "../delete-account-dialog/delete-account-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { NGXLogger } from "ngx-logger";
import { getDownloadURL, UploadTask } from "@angular/fire/storage";

@Component({
    selector: "tickist-user",
    templateUrl: "./user.component.html",
    styleUrls: ["./user.component.scss"],
})
export class UserComponent implements OnInit, OnDestroy {
    @ViewChild("changeAvatarInput") changeAvatarInput: ElementRef;
    menu: Array<any>;
    changePasswordForm: UntypedFormGroup;
    userData: UntypedFormGroup;
    userSettings: UntypedFormGroup;
    userNotificationSettings: UntypedFormGroup;
    user: User = null;
    dailySummaryCheckbox: boolean;
    staticUrl: string;
    tasksOrderOptions: Array<string>;
    defaultTaskViewOptions: Array<any>;
    overdueTasksSortByOptions: Array<any>;
    futureTasksSortByOptions: Array<any>;
    requestChangePasswordMessage: string;
    matcher = new MyErrorStateMatcher();
    uploadTask: UploadTask;
    browserNotificationPermission = Notification.permission;
    isNotificationAllowed: boolean;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private fb: UntypedFormBuilder,
        private store: Store,
        private location: Location,
        private notificationsService: NotificationsService,
        public dialog: MatDialog,
        private configurationService: ConfigurationService,
        private userService: UserService,
        private logger: NGXLogger,
    ) {
        this.staticUrl = environment["staticUrl"];
        this.tasksOrderOptions = TASKS_ORDER_OPTIONS;
        this.defaultTaskViewOptions = TASKS_VIEWS_LIST;
        this.overdueTasksSortByOptions = this.configurationService.loadConfiguration().commons.overdueTasksSortByOptions;
        this.futureTasksSortByOptions = this.configurationService.loadConfiguration().commons.futureTasksSortByOptions;
        this.menu = this.createMenuDict();
    }

    createMenuDict() {
        return [
            {
                name: "main",
                isActive: true,
                id: 1,
            },
            {
                name: "password",
                isActive: false,
                id: 2,
            },
            {
                name: "notifications",
                isActive: false,
                id: 3,
            },
            {
                name: "settings",
                isActive: false,
                id: 4,
            },
        ];
    }

    ngOnInit(): void {
        this.store
            .select(selectLoggedInUser)
            .pipe(
                filter((user) => !!user),
                takeUntil(this.ngUnsubscribe),
            )
            .subscribe((user) => {
                // @TODO too much logic. Fix It
                this.isNotificationAllowed = user.notificationPermission === NotificationPermission.yes;
                // this.uploadPercent = new Observable<number>();
                this.user = user;
                this.dailySummaryCheckbox = !!user.dailySummaryHour;
                this.userData = new UntypedFormGroup(
                    {
                        username: new UntypedFormControl(user.username, {
                            validators: [Validators.required, Validators.minLength(4)],
                        }),
                        email: new UntypedFormControl(
                            { value: user.email, disabled: true },
                            {
                                validators: [Validators.required, Validators.email],
                            },
                        ),
                    },
                    { updateOn: "blur" },
                );

                this.userData
                    .get("username")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        this.changeUserDetails(Object.assign({}, this.user, { username: newValue }));
                    });
                this.userSettings = new UntypedFormGroup({
                    orderTasksDashboard: new UntypedFormControl(user.orderTasksDashboard, { validators: [Validators.required] }),
                    defaultTaskView: new UntypedFormControl(user.defaultTaskView, {
                        validators: [Validators.required],
                    }),
                    defaultTaskViewTodayView: new UntypedFormControl(user.defaultTaskViewTodayView, { validators: [Validators.required] }),
                    defaultTaskViewOverdueView: new UntypedFormControl(user.defaultTaskViewOverdueView, {
                        validators: [Validators.required],
                    }),
                    defaultTaskViewFutureView: new UntypedFormControl(user.defaultTaskViewFutureView, {
                        validators: [Validators.required],
                    }),
                    defaultTaskViewTagsView: new UntypedFormControl(user.defaultTaskViewTagsView, { validators: [Validators.required] }),
                    overdueTasksSortBy: new UntypedFormControl(user.overdueTasksSortBy, { validators: [Validators.required] }),
                    futureTasksSortBy: new UntypedFormControl(user.futureTasksSortBy, {
                        validators: [Validators.required],
                    }),
                    dialogTimeWhenTaskFinishedInProject: new UntypedFormControl(user.dialogTimeWhenTaskFinishedInProject, {
                        validators: [Validators.required],
                    }),
                });
                // @TODO Fix it a lot of duplicated code.

                this.userSettings
                    .get("orderTasksDashboard")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        const updatedUser = Object.assign({}, this.user, {
                            orderTasksDashboard: newValue,
                        });
                        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
                    });
                this.userSettings
                    .get("defaultTaskView")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        const updatedUser = Object.assign({}, this.user, {
                            defaultTaskView: newValue,
                        });
                        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
                    });

                this.userSettings
                    .get("defaultTaskViewTodayView")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        const updatedUser = Object.assign({}, this.user, {
                            defaultTaskViewTodayView: newValue,
                        });
                        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
                    });
                this.userSettings
                    .get("defaultTaskViewOverdueView")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        const updatedUser = Object.assign({}, this.user, {
                            defaultTaskViewOverdueView: newValue,
                        });
                        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
                    });
                this.userSettings
                    .get("defaultTaskViewFutureView")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        const updatedUser = Object.assign({}, this.user, {
                            defaultTaskViewFutureView: newValue,
                        });
                        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
                    });
                this.userSettings
                    .get("defaultTaskViewTagsView")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        const updatedUser = Object.assign({}, this.user, {
                            defaultTaskViewTagsView: newValue,
                        });
                        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
                    });

                this.userSettings
                    .get("overdueTasksSortBy")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        const updatedUser = Object.assign({}, this.user, {
                            overdueTasksSortBy: newValue,
                        });
                        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
                    });
                this.userSettings
                    .get("futureTasksSortBy")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        const updatedUser = Object.assign({}, this.user, {
                            futureTasksSortBy: newValue,
                        });
                        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
                    });

                this.userSettings
                    .get("dialogTimeWhenTaskFinishedInProject")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        const updatedUser = Object.assign({}, this.user, {
                            dialogTimeWhenTaskFinishedInProject: newValue,
                        });
                        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
                    });

                this.userNotificationSettings = new UntypedFormGroup({
                    dailySummaryHour: new UntypedFormControl({
                        value: user.dailySummaryHour,
                        disabled: !this.dailySummaryCheckbox,
                    }),
                    dailySummaryCheckbox: new UntypedFormControl(this.dailySummaryCheckbox),
                    removesMeFromSharedList: new UntypedFormControl(
                        {
                            value: user.removesMeFromSharedList,
                            disabled: !this.isNotificationAllowed,
                        },
                        { validators: [Validators.required] },
                    ),
                    assignsTaskToMe: new UntypedFormControl(user.assignsTaskToMe, {
                        validators: [Validators.required],
                    }),
                    completesTaskFromSharedList: new UntypedFormControl(user.completesTaskFromSharedList, {
                        validators: [Validators.required],
                    }),
                    changesTaskFromSharedListThatIsAssignedToMe: new UntypedFormControl(user.changesTaskFromSharedListThatIsAssignedToMe, {
                        validators: [Validators.required],
                    }),
                    changesTaskFromSharedListThatIAssignedToHimHer: new UntypedFormControl(
                        user.changesTaskFromSharedListThatIAssignedToHimHer,
                        { validators: [Validators.required] },
                    ),
                    leavesSharedList: new UntypedFormControl(user.leavesSharedList, {
                        validators: [Validators.required],
                    }),
                    sharesListWithMe: new UntypedFormControl(user.sharesListWithMe, {
                        validators: [Validators.required],
                    }),
                    deletesListSharedWithMe: new UntypedFormControl(user.deletesListSharedWithMe, { validators: [Validators.required] }),
                });

                this.userNotificationSettings
                    .get("dailySummaryHour")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        const updatedUser = Object.assign({}, this.user, {
                            dailySummaryHour: newValue,
                        });
                        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
                    });

                this.userNotificationSettings
                    .get("dailySummaryCheckbox")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe(() => {
                        this.toggleDailySummary();
                    });
                this.userNotificationSettings
                    .get("removesMeFromSharedList")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        const updatedUser = Object.assign({}, this.user, {
                            removesMeFromSharedList: newValue,
                        });
                        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
                    });

                this.userNotificationSettings
                    .get("assignsTaskToMe")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        const updatedUser = Object.assign({}, this.user, {
                            assignsTaskToMe: newValue,
                        });
                        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
                    });
                this.userNotificationSettings
                    .get("completesTaskFromSharedList")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        const updatedUser = Object.assign({}, this.user, {
                            completesTaskFromSharedList: newValue,
                        });
                        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
                    });
                this.userNotificationSettings
                    .get("changesTaskFromSharedListThatIsAssignedToMe")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        const updatedUser = Object.assign({}, this.user, {
                            changesTaskFromSharedListThatIsAssignedToMe: newValue,
                        });
                        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
                    });
                this.userNotificationSettings
                    .get("changesTaskFromSharedListThatIAssignedToHimHer")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        const updatedUser = Object.assign({}, this.user, {
                            changesTaskFromSharedListThatIAssignedToHimHer: newValue,
                        });
                        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
                    });

                this.userNotificationSettings
                    .get("leavesSharedList")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        const updatedUser = Object.assign({}, this.user, {
                            leavesSharedList: newValue,
                        });
                        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
                    });
                this.userNotificationSettings
                    .get("sharesListWithMe")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        const updatedUser = Object.assign({}, this.user, {
                            sharesListWithMe: newValue,
                        });
                        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
                    });

                this.userNotificationSettings
                    .get("deletesListSharedWithMe")
                    .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((newValue) => {
                        this.updateUserSettings({
                            deletesListSharedWithMe: newValue,
                        });
                    });

                this.userNotificationSettings.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe((newValue) => {
                    this.logger.debug({ newValue });
                });
            });

        this.changePasswordForm = new UntypedFormGroup({
            email: new UntypedFormControl("", Validators.compose([Validators.required, Validators.email])),
        });
        this.store.dispatch(hideAddTaskButton());
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        this.store.dispatch(showAddTaskButton());
    }

    updateUserSettings(newValue) {
        const updatedUser = Object.assign({}, this.user, newValue);
        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
    }

    toggleDailySummary() {
        let dailySummaryHour;
        this.dailySummaryCheckbox = !this.dailySummaryCheckbox;
        // @TODO you can remove first part of if statement
        if (this.dailySummaryCheckbox) {
            dailySummaryHour = "";
        } else {
            dailySummaryHour = DEFAULT_DAILY_SUMMARY_HOUR;
        }
        this.changeUserDetails(Object.assign({}, this.user, { dailySummaryHour: dailySummaryHour }));
    }

    changeAvatarTrigger(): void {
        const clickEvent = new MouseEvent("click", { bubbles: true });
        this.changeAvatarInput.nativeElement.dispatchEvent(clickEvent);
    }

    changeAvatar(event: any) {
        // @TODO not working
        const file = event.target.files[0];
        this.uploadTask = this.userService.changeUserAvatar(file, this.user);
        this.uploadTask.on(
            "state_changed",
            (snapshot) => {
                // Observe state change events such as progress, pause, and resume
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log("Upload is " + progress + "% done");
                switch (snapshot.state) {
                    case "paused":
                        console.log("Upload is paused");
                        break;
                    case "running":
                        console.log("Upload is running");
                        break;
                }
            },
            () => {
                // Handle unsuccessful uploads
            },
            () => {
                // Handle successful uploads on complete
                // For instance, get the download URL: https://firebasestorage.googleapis.com/...
                getDownloadURL(this.uploadTask.snapshot.ref).then((downloadURL) => {
                    console.log("File available at", downloadURL);
                });
            },
        );
    }

    changeActiveItemInMenu(name): void {
        this.menu.forEach((item) => (item.isActive = false));
        this.menu.find((item) => item.name === name).isActive = true;
    }

    checkActiveItemInMenu(name): boolean {
        return this.menu.find((item) => item.name === name).isActive;
    }

    changeUserDetails(updatedUser) {
        this.store.dispatch(requestUpdateUser({ user: updatedUser }));
    }

    setDefaultAvatar() {
        this.store.dispatch(changeAvatar({ avatarUrl: DEFAULT_USER_AVATAR }));
    }

    getErrorMessage(field: AbstractControl): string {
        return field.hasError("minLength")
            ? "Field is too short."
            : field.hasError("required")
              ? "This field is required."
              : field.hasError("email")
                ? "This email is invalid."
                : "";
    }

    hasErrorMessage(field: AbstractControl): boolean {
        return field.hasError("minLength") || field.hasError("email") || field.hasError("required");
    }

    async changePassword($event, values: any): Promise<void> {
        try {
            const result = await this.userService.requestChangePassword(values.email);
            this.logger.debug({ result });
            this.requestChangePasswordMessage = "Check your inbox.";
        } catch (err) {
            this.logger.error({ err });
            this.requestChangePasswordMessage = "Something goes wrong.";
        }
    }

    close(): void {
        // DRY
        this.location.back();
    }

    updateNotificationPermission() {
        if (this.user.notificationPermission === NotificationPermission.yes) {
            this.store.dispatch(removeNotificationPermission());
        } else {
            this.notificationsService.createFcmToken();
        }
    }

    showDeleteAccountDialog() {
        this.dialog.open(DeleteAccountDialogComponent);
    }
}
