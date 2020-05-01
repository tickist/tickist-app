import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {User} from '@data/users/models';
import {UserService} from '../../../../core/services/user.service';
import {AbstractControl, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Location} from '@angular/common';
import {ConfigurationService} from '../../../../core/services/configuration.service';
import {environment} from '@env/environment';
import {MyErrorStateMatcher} from '../../../../shared/error-state-matcher';
import {Observable, Subject} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {selectLoggedInUser} from '../../../../core/selectors/user.selectors';
import {changeAvatar, removeNotificationPermission, RequestUpdateUser} from '../../../../core/actions/user.actions';
import {HideAddTaskButton, ShowAddTaskButton} from '../../../../core/actions/add-task-button-visibility.actions';
import {DEFAULT_DAILY_SUMMARY_HOUR, DEFAULT_USER_AVATAR, TASKS_ORDER_OPTIONS} from '@data/users/config-user';
import {NotificationPermission} from '@data';
import {NotificationsService} from '../../../notifications/services/notifications.service';

@Component({
    selector: 'tickist-user',
    templateUrl: './user.component.html',
    styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit, OnDestroy {
    menu: Array<any>;
    changePasswordForm: FormGroup;
    userData: FormGroup;
    userSettings: FormGroup;
    userNotificationSettings: FormGroup;
    user: User = null;
    dailySummaryCheckbox: boolean;
    staticUrl: string;
    tasksOrderOptions: Array<string>;
    defaultTaskViewOptions: Array<any>;
    overdueTasksSortByOptions: Array<any>;
    futureTasksSortByOptions: Array<any>;
    requestChangePasswordMessage: string;
    matcher = new MyErrorStateMatcher();
    uploadPercent: Observable<number>;
    browserNotificationPermission = Notification.permission;
    isNotificationAllowed: boolean;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    @ViewChild('changeAvatarInput') changeAvatarInput: ElementRef;

    constructor(private fb: FormBuilder, private store: Store<{}>, private location: Location,
                private notificationsService: NotificationsService,
                private configurationService: ConfigurationService, private userService: UserService) {

        this.staticUrl = environment['staticUrl'];
        this.tasksOrderOptions = TASKS_ORDER_OPTIONS;
        this.defaultTaskViewOptions = this.configurationService.loadConfiguration()['commons']['DEFAULT_TASK_VIEW_OPTIONS'];
        this.overdueTasksSortByOptions = this.configurationService.loadConfiguration()['commons']['OVERDUE_TASKS_SORT_BY_OPTIONS'];
        this.futureTasksSortByOptions = this.configurationService.loadConfiguration()['commons']['FUTURE_TASKS_SORT_BY_OPTIONS'];
        this.menu = this.createMenuDict();
    }

    createMenuDict() {
        return [
            {
                name: 'main',
                isActive: true,
                id: 1
            },
            {
                name: 'password',
                isActive: false,
                id: 2
            },
            {
                name: 'notifications',
                isActive: false,
                id: 3
            },
            {
                name: 'settings',
                isActive: false,
                id: 4
            },
        ];
    }

    ngOnInit(): void {
        this.store
            .pipe(
                select(selectLoggedInUser),
                filter(user => !!user),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((user) => {
                // @TODO too much logic. Fix It
                this.isNotificationAllowed = user.notificationPermission === NotificationPermission.yes;
                this.uploadPercent = new Observable<number>();
                this.user = user;
                this.dailySummaryCheckbox = !!user.dailySummaryHour;
                this.userData = new FormGroup({
                    'username': new FormControl(user.username,
                        {validators: [Validators.required, Validators.minLength(4)]}),
                    'email': new FormControl({value: user.email, disabled: true},
                        {validators: [Validators.required, Validators.email]}),
                }, {updateOn: 'blur'});

                this.userData.get('username').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    this.changeUserDetails(Object.assign({}, this.user, {username: newValue}));
                });
                this.userSettings = new FormGroup({
                    'orderTasksDashboard': new FormControl(user.orderTasksDashboard, {validators: [Validators.required]}),
                    'defaultTaskView': new FormControl(user.defaultTaskView, {validators: [Validators.required]}),
                    'defaultTaskViewTodayView': new FormControl(user.defaultTaskViewTodayView, {validators: [Validators.required]}),
                    'defaultTaskViewOverdueView': new FormControl(user.defaultTaskViewOverdueView, {validators: [Validators.required]}),
                    'defaultTaskViewFutureView': new FormControl(user.defaultTaskViewFutureView, {validators: [Validators.required]}),
                    'defaultTaskViewTagsView': new FormControl(user.defaultTaskViewTagsView, {validators: [Validators.required]}),
                    'overdueTasksSortBy': new FormControl(user.overdueTasksSortBy, {validators: [Validators.required]}),
                    'futureTasksSortBy': new FormControl(user.futureTasksSortBy, {validators: [Validators.required]}),
                    'dialogTimeWhenTaskFinishedInProject': new FormControl(
                        user.dialogTimeWhenTaskFinishedInProject, {validators: [Validators.required]}
                    )
                });
                // @TODO Fix it a lot of duplicated code.

                this.userSettings.get('orderTasksDashboard').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    const updatedUser = Object.assign({}, this.user, {orderTasksDashboard: newValue});
                    this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                    );
                });
                this.userSettings.get('defaultTaskView').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    const updatedUser = Object.assign({}, this.user, {defaultTaskView: newValue});
                    this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                    );
                });

                this.userSettings.get('defaultTaskViewTodayView').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    const updatedUser = Object.assign({}, this.user, {defaultTaskViewTodayView: newValue});
                    this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                    );
                });
                this.userSettings.get('defaultTaskViewOverdueView').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    const updatedUser = Object.assign({}, this.user, {defaultTaskViewOverdueView: newValue});
                    this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                    );
                });
                this.userSettings.get('defaultTaskViewFutureView').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    const updatedUser = Object.assign({}, this.user, {defaultTaskViewFutureView: newValue});
                    this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                    );
                });
                this.userSettings.get('defaultTaskViewTagsView').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    const updatedUser = Object.assign({}, this.user, {defaultTaskViewTagsView: newValue});
                    this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                    );
                });

                this.userSettings.get('overdueTasksSortBy').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    const updatedUser = Object.assign({}, this.user, {overdueTasksSortBy: newValue});
                    this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                    );
                });
                this.userSettings.get('futureTasksSortBy').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    const updatedUser = Object.assign({}, this.user, {futureTasksSortBy: newValue});
                    this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                    );
                });

                this.userSettings.get('dialogTimeWhenTaskFinishedInProject').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    const updatedUser = Object.assign({}, this.user, {dialogTimeWhenTaskFinishedInProject: newValue});
                    this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                    );
                });

                this.userNotificationSettings = new FormGroup({
                    'dailySummaryHour': new FormControl({value: user.dailySummaryHour, disabled: !this.dailySummaryCheckbox}),
                    'dailySummaryCheckbox': new FormControl(this.dailySummaryCheckbox),
                    'removesMeFromSharedList': new FormControl({
                        value: user.removesMeFromSharedList,
                        disabled: !this.isNotificationAllowed
                    }, {validators: [Validators.required]}),
                    'assignsTaskToMe': new FormControl(user.assignsTaskToMe, {validators: [Validators.required]}),
                    'completesTaskFromSharedList': new FormControl(
                        user.completesTaskFromSharedList, {validators: [Validators.required]}
                    ),
                    'changesTaskFromSharedListThatIsAssignedToMe': new FormControl(
                        user.changesTaskFromSharedListThatIsAssignedToMe, {validators: [Validators.required]}
                    ),
                    'changesTaskFromSharedListThatIAssignedToHimHer': new FormControl(
                        user.changesTaskFromSharedListThatIAssignedToHimHer, {validators: [Validators.required]}
                    ),
                    'leavesSharedList': new FormControl(user.leavesSharedList, {validators: [Validators.required]}),
                    'sharesListWithMe': new FormControl(user.sharesListWithMe, {validators: [Validators.required]}),
                    'deletesListSharedWithMe': new FormControl(
                        user.deletesListSharedWithMe, {validators: [Validators.required]}
                    )
                });

                this.userNotificationSettings.get('dailySummaryHour').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    const updatedUser = Object.assign({}, this.user, {dailySummaryHour: newValue});
                    this.store.dispatch(new RequestUpdateUser({user: updatedUser}));
                });

                this.userNotificationSettings.get('dailySummaryCheckbox').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    this.toggleDailySummary();
                });
                this.userNotificationSettings.get('removesMeFromSharedList').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    const updatedUser = Object.assign({}, this.user, {removesMeFromSharedList: newValue});
                    this.store.dispatch(new RequestUpdateUser({user: updatedUser}));
                });

                this.userNotificationSettings.get('assignsTaskToMe').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    const updatedUser = Object.assign({}, this.user, {assignsTaskToMe: newValue});
                    this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                    );
                });
                this.userNotificationSettings.get('completesTaskFromSharedList').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    const updatedUser = Object.assign({}, this.user, {completesTaskFromSharedList: newValue});
                    this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                    );
                });
                this.userNotificationSettings.get('changesTaskFromSharedListThatIsAssignedToMe').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    const updatedUser = Object.assign({}, this.user, {changesTaskFromSharedListThatIsAssignedToMe: newValue});
                    this.store.dispatch(new RequestUpdateUser({user: updatedUser}));
                });
                this.userNotificationSettings.get('changesTaskFromSharedListThatIAssignedToHimHer').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    const updatedUser = Object.assign({}, this.user, {changesTaskFromSharedListThatIAssignedToHimHer: newValue});
                    this.store.dispatch(new RequestUpdateUser({user: updatedUser}));
                });

                this.userNotificationSettings.get('leavesSharedList').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    const updatedUser = Object.assign({}, this.user, {leavesSharedList: newValue});
                    this.store.dispatch(new RequestUpdateUser({user: updatedUser}));
                });
                this.userNotificationSettings.get('sharesListWithMe').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    const updatedUser = Object.assign({}, this.user, {sharesListWithMe: newValue});
                    this.store.dispatch(new RequestUpdateUser({user: updatedUser}));
                });

                this.userNotificationSettings.get('deletesListSharedWithMe').valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    this.updateUserSettings({deletesListSharedWithMe: newValue});
                });

                this.userNotificationSettings.valueChanges.pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(newValue => {
                    console.log({newValue});
                });


            });

        this.changePasswordForm = new FormGroup({
            'email': new FormControl('', Validators.compose([Validators.required, Validators.email])),
        });
        this.store.dispatch(new HideAddTaskButton());

    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        this.store.dispatch(new ShowAddTaskButton());
    }

    updateUserSettings(newValue) {
        const updatedUser = Object.assign({}, this.user, newValue);
        this.store.dispatch(new RequestUpdateUser({user: updatedUser}));
    }

    toggleDailySummary() {
        let dailySummaryHour;
        this.dailySummaryCheckbox = !this.dailySummaryCheckbox;
        // @TODO you can remove first part of if statement
        if (this.dailySummaryCheckbox) {
            dailySummaryHour = '';
        } else {
            dailySummaryHour = DEFAULT_DAILY_SUMMARY_HOUR;
        }
        this.changeUserDetails(Object.assign({}, this.user, {dailySummaryHour: dailySummaryHour}));
    }

    changeAvatarTrigger(): void {
        const clickEvent = new MouseEvent('click', {bubbles: true});
        this.changeAvatarInput.nativeElement.dispatchEvent(clickEvent);
    }

    changeAvatar(event: any) {
        const file = event.target.files[0];
        this.uploadPercent = this.userService.changeUserAvatar(file, this.user);
    }

    changeActiveItemInMenu(name): void {
        this.menu.forEach(item => item.isActive = false);
        this.menu.find(item => item.name === name).isActive = true;
    }

    checkActiveItemInMenu(name): boolean {
        return this.menu.find(item => item.name === name).isActive;
    }

    changeUserDetails(updatedUser) {
        this.store.dispatch(new RequestUpdateUser({user: updatedUser}));
    }

    setDefaultAvatar() {
        this.store.dispatch(changeAvatar({avatarUrl: DEFAULT_USER_AVATAR}));
    }

    getErrorMessage(field: AbstractControl): string {
        return field.hasError('minLength') ? 'Field is too short.' :
            field.hasError('required') ? 'This field is required.' :
                field.hasError('email') ? 'This email is invalid.' : '';
    }

    hasErrorMessage(field: AbstractControl): boolean {
        return field.hasError('minLength') || field.hasError('email') || field.hasError('required');
    }


    async changePassword($event, values: any): Promise<void> {
        try {
            const result = await this.userService.requestChangePassword(values.email);
            console.log({result});
            this.requestChangePasswordMessage = 'Check your inbox.';
        } catch (err) {
            console.log({err});
            this.requestChangePasswordMessage = 'Something goes wrong.';
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


}
