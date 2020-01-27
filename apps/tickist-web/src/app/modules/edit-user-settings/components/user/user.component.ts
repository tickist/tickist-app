import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {User} from '@data/users/models';
import {UserService} from '../../../../core/services/user.service';
import {AbstractControl, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Location} from '@angular/common';
import {ConfigurationService} from '../../../../core/services/configuration.service';
import {environment} from '@env/environment';
import {MyErrorStateMatcher} from '../../../../shared/error-state-matcher';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {selectLoggedInUser} from '../../../../core/selectors/user.selectors';
import {changeAvatar, RequestUpdateUser} from '../../../../core/actions/user.actions';
import {HideAddTaskButton, ShowAddTaskButton} from '../../../../core/actions/add-task-button-visibility.actions';
import {DEFAULT_DAILY_SUMMARY_HOUR, DEFAULT_USER_AVATAR, TASKS_ORDER_OPTIONS} from '@data/users/config-user';

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
    matcher = new MyErrorStateMatcher();
    uploadPercent: Observable<number>;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    @ViewChild('changeAvatarInput', {static: false}) changeAvatarInput: ElementRef;

    constructor(private fb: FormBuilder, private store: Store<{}>, private location: Location,
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
                id: 1
            },
            {
                name: 'notifications',
                isActive: false,
                id: 1
            },
            {
                name: 'settings',
                isActive: false,
                id: 1
            },
        ];
    }

    ngOnInit(): void {
        this.store.select(selectLoggedInUser)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((user) => {
                // @TODO too much logic. Fix It
                if (user) {
                    this.uploadPercent = new Observable<number>();
                    this.user = user;
                    this.dailySummaryCheckbox = !!user.dailySummaryHour;
                    this.userData = new FormGroup({
                        'username': new FormControl(user.username,
                            {validators: [Validators.required, Validators.minLength(4)]}),
                        'email': new FormControl({value: user.email, disabled: true},
                            {validators: [Validators.required, Validators.email]}),
                    }, {updateOn: 'blur'});

                    this.userData.get('username').valueChanges.subscribe(newValue => {
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

                    this.userSettings.get('orderTasksDashboard').valueChanges.subscribe(newValue => {
                        const updatedUser = Object.assign({}, this.user, {orderTasksDashboard: newValue});
                        this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                        );
                    });
                    this.userSettings.get('defaultTaskView').valueChanges.subscribe(newValue => {
                        const updatedUser = Object.assign({}, this.user, {defaultTaskView: newValue});
                        this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                        );
                    });

                    this.userSettings.get('defaultTaskViewTodayView').valueChanges.subscribe(newValue => {
                        const updatedUser = Object.assign({}, this.user, {defaultTaskViewTodayView: newValue});
                        this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                        );
                    });
                    this.userSettings.get('defaultTaskViewOverdueView').valueChanges.subscribe(newValue => {
                        const updatedUser = Object.assign({}, this.user, {defaultTaskViewOverdueView: newValue});
                        this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                        );
                    });
                    this.userSettings.get('defaultTaskViewFutureView').valueChanges.subscribe(newValue => {
                        const updatedUser = Object.assign({}, this.user, {defaultTaskViewFutureView: newValue});
                        this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                        );
                    });
                    this.userSettings.get('defaultTaskViewTagsView').valueChanges.subscribe(newValue => {
                        const updatedUser = Object.assign({}, this.user, {defaultTaskViewTagsView: newValue});
                        this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                        );
                    });

                    this.userSettings.get('overdueTasksSortBy').valueChanges.subscribe(newValue => {
                        const updatedUser = Object.assign({}, this.user, {overdueTasksSortBy: newValue});
                        this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                        );
                    });
                    this.userSettings.get('futureTasksSortBy').valueChanges.subscribe(newValue => {
                        const updatedUser = Object.assign({}, this.user, {futureTasksSortBy: newValue});
                        this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                        );
                    });

                    this.userSettings.get('dialogTimeWhenTaskFinishedInProject').valueChanges.subscribe(newValue => {
                        const updatedUser = Object.assign({}, this.user, {dialogTimeWhenTaskFinishedInProject: newValue});
                        this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                        );
                    });

                    this.userNotificationSettings = new FormGroup({
                        'dailySummaryHour': new FormControl({value: user.dailySummaryHour, disabled: !this.dailySummaryCheckbox}),
                        'dailySummaryCheckbox': new FormControl(this.dailySummaryCheckbox),
                        'removesMeFromSharedList': new FormControl(user.removesMeFromSharedList, {validators: [Validators.required]}),
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

                    this.userNotificationSettings.get('dailySummaryHour').valueChanges.subscribe(newValue => {
                        const updatedUser = Object.assign({}, this.user, {dailySummaryHour: newValue});
                        this.store.dispatch(new RequestUpdateUser({user: updatedUser}));
                    });

                    this.userNotificationSettings.get('dailySummaryCheckbox').valueChanges.subscribe(newValue => {
                        this.toggleDailySummary();
                    });
                    this.userNotificationSettings.get('removesMeFromSharedList').valueChanges.subscribe(newValue => {
                        const updatedUser = Object.assign({}, this.user, {removesMeFromSharedList: newValue});
                        this.store.dispatch(new RequestUpdateUser({user: updatedUser}));
                    });

                    this.userNotificationSettings.get('assignsTaskToMe').valueChanges.subscribe(newValue => {
                        const updatedUser = Object.assign({}, this.user, {assignsTaskToMe: newValue});
                        this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                        );
                    });
                    this.userNotificationSettings.get('completesTaskFromSharedList').valueChanges.subscribe(newValue => {
                        const updatedUser = Object.assign({}, this.user, {completesTaskFromSharedList: newValue});
                        this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                        );
                    });
                    this.userNotificationSettings.get('changesTaskFromSharedListThatIsAssignedToMe').valueChanges.subscribe(newValue => {
                        const updatedUser = Object.assign({}, this.user, {changesTaskFromSharedListThatIsAssignedToMe: newValue});
                        this.store.dispatch(new RequestUpdateUser({user: updatedUser}));
                    });
                    this.userNotificationSettings.get('changesTaskFromSharedListThatIAssignedToHimHer').valueChanges.subscribe(newValue => {
                        const updatedUser = Object.assign({}, this.user, {changesTaskFromSharedListThatIAssignedToHimHer: newValue});
                        this.store.dispatch(new RequestUpdateUser({user: updatedUser}));
                    });

                    this.userNotificationSettings.get('leavesSharedList').valueChanges.subscribe(newValue => {
                        const updatedUser = Object.assign({}, this.user, {leavesSharedList: newValue});
                        this.store.dispatch(new RequestUpdateUser({user: updatedUser}));
                    });
                    this.userNotificationSettings.get('sharesListWithMe').valueChanges.subscribe(newValue => {
                        const updatedUser = Object.assign({}, this.user, {sharesListWithMe: newValue});
                        this.store.dispatch(new RequestUpdateUser({user: updatedUser}));
                    });


                    this.userNotificationSettings.get('deletesListSharedWithMe').valueChanges.subscribe(newValue => {
                        const updatedUser = Object.assign({}, this.user, {deletesListSharedWithMe: newValue});
                        this.store.dispatch(new RequestUpdateUser({user: updatedUser})
                        );
                    });


                }
            });

        this.changePasswordForm = new FormGroup({
            'password': new FormControl('', Validators.compose([Validators.required, Validators.minLength(4)])),
            'newPassword': new FormControl('', Validators.compose([Validators.required, Validators.minLength(4)])),
            'repeatNewPassword': new FormControl('', Validators.compose([Validators.required, Validators.minLength(4)]))
        }, {validators: this.matchingPasswords});
        this.store.dispatch(new HideAddTaskButton());

    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        this.store.dispatch(new ShowAddTaskButton());
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
        this.uploadPercent = this.userService.changeUserAvatar(file, this.user)
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
        this.store.dispatch(changeAvatar({avatarUrl: DEFAULT_USER_AVATAR}))
    }
    getErrorMessage(field: AbstractControl): string {
        return field.hasError('minLength') ? 'Field is too short.' :
            field.hasError('required') ? 'This field is required.' :
                field.hasError('email') ? 'This email is invalid.' : '';
    }

    hasErrorMessage(field: AbstractControl): boolean {
        return field.hasError('minLength') || field.hasError('email') || field.hasError('required');
    }

    private matchingPasswords(group: any) {
        const password = group.controls.password;
        const newPassword = group.controls.newPassword;
        const repeatNewPassword = group.controls.repeatNewPassword;
        let result = null;
        if (newPassword.value !== repeatNewPassword.value) {
            result = {
                mismatchedPasswords: true
            };
        }
        if (password.value === newPassword.value) {
            result = {
                oldSameNew: true
            };
        }
        return result;
    }

    changePassword($event, values: any): void {
        this.userService.changePassword(values)
        //     .subscribe(() => {
        // }, (error: any) => {
        //     console.log(error);
        //     this.changePasswordForm.setErrors({'wrongPassword': true});
        // });
    }

    close(): void {
        // DRY
        this.location.back();
    }


}
