import {Component, OnInit, ElementRef, Renderer2, ViewChild, OnDestroy} from '@angular/core';
import {User} from '../models/user';
import {UserService} from '../services/userService';
import {FormBuilder, FormGroup, FormControl, Validators, AbstractControl} from '@angular/forms';
import {Location} from '@angular/common';
import {ConfigurationService} from '../services/configurationService';
import {environment} from '../../environments/environment';
import {MyErrorStateMatcher} from '../shared/error-state-matcher';

@Component({
    selector: 'app-user',
    templateUrl: './user.component.html',
    styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit, OnDestroy {
    menu = {};
    changePasswordForm: FormGroup;
    userData: FormGroup;
    user: User = null;
    dailySummaryCheckbox: boolean;
    staticUrl: string;
    tasksOrderOptions: Array<string>;
    defaultTaskViewOptions: Array<any>;
    overdueTasksSortByOptions: Array<any>;
    futureTasksSortByOptions: Array<any>;
    matcher = new MyErrorStateMatcher();
    @ViewChild('changeAvatarInput') changeAvatarInput: ElementRef;

    constructor(private fb: FormBuilder, private userService: UserService, private location: Location,
                protected configurationService: ConfigurationService, private renderer: Renderer2) {

        this.staticUrl = environment['staticUrl'];
        this.tasksOrderOptions = this.configurationService.loadConfiguration()['commons']['TASKS_ORDER_OPTIONS'];
        this.defaultTaskViewOptions = this.configurationService.loadConfiguration()['commons']['DEFAULT_TASK_VIEW_OPTIONS'];
        this.overdueTasksSortByOptions = this.configurationService.loadConfiguration()['commons']['OVERDUE_TASKS_SORT_BY_OPTIONS'];
        this.futureTasksSortByOptions = this.configurationService.loadConfiguration()['commons']['FUTURE_TASKS_SORT_BY_OPTIONS'];
        this.menu = {
            'main': true, 'password': false, 'notifications': false, 'settings': false
        };

    }


    ngOnInit(): void {
        this.userService.user$.subscribe((user) => {
            if (user) {
                this.user = user;
                this.dailySummaryCheckbox = !!user.dailySummaryHour;
                this.userData = new FormGroup({
                    'username': new FormControl(user.username,
                        {validators: [Validators.required, Validators.minLength(4)]}),
                    'email': new FormControl({value: user.email, disabled: true},
                        {validators: [Validators.required, Validators.email]}),
                }, { updateOn: 'blur' });

                this.userData.get('username').valueChanges.subscribe(newValue => {
                    this.user.username = newValue;
                    this.changeUserDetails();
                });
            }
        });

        this.changePasswordForm = new FormGroup({
            'oldPassword': new FormControl('', Validators.compose([Validators.required, Validators.minLength(4)])),
            'newPassword': new FormControl('', Validators.compose([Validators.required, Validators.minLength(4)])),
            'confirmNewPassword': new FormControl('', Validators.compose([Validators.required, Validators.minLength(4)]))
        }, {validators: this.matchingPasswords});

        this.configurationService.changeOpenStateLeftSidenavVisibility('close');
        this.configurationService.changeOpenStateRightSidenavVisibility('close');
        this.configurationService.updateAddTaskComponentVisibility(false);

    }

    ngOnDestroy(): void {
        this.configurationService.updateLeftSidenavVisibility();
        this.configurationService.updateRightSidenavVisibility();
        this.configurationService.updateAddTaskComponentVisibility(true);
    }

    toggleDailySumary() {
        this.dailySummaryCheckbox = !this.dailySummaryCheckbox;
        if (this.dailySummaryCheckbox) {
            this.user.dailySummaryHour = null;
        } else {
            const d = new Date();
            d.setHours(7, 0);
            d.setMinutes(0);
            this.user.dailySummaryHour = d;
        }
        this.changeUserDetails();
    }

    changeAvatarTrigger(): void {
        const clickEvent = new MouseEvent('click', {bubbles: true});
        this.changeAvatarInput.nativeElement.dispatchEvent(clickEvent);
    }

    changeAvatar(event: any) {
        const file = event.target.files[0];
        this.userService.changeAvatar(file).then((data) => {
            this.userService.loadUser();
        });
    }

    changeActiveItemInMenu(menu_item) {
        // DRY
        for (let key in this.menu) {
            this.menu[key] = false;
        }
        this.menu[menu_item] = true;
    }

    checkActiveItemInMenu(menu_item) {
        // DRY
        return this.menu[menu_item];
    }

    changeUserDetails() {
        this.userService.updateUser(this.user);
    }

    getErrorMessage(field: AbstractControl): string {
        return field.hasError('minLength') ? 'Field is too short.' :
            field.hasError('required') ? 'This field is required.' :
            field.hasError('email') ? 'This email is invalid.' : '';
    }

    hasErrorMessage(field: AbstractControl): boolean {
        return field.hasError('minLength') || field.hasError('email') ||  field.hasError('required');
    }

    private matchingPasswords(group: any) {
        const oldPassword = group.controls.oldPassword;
        const newPassword = group.controls.newPassword;
        const confirmNewPassword = group.controls.confirmNewPassword;
        let result = null;
        if (newPassword.value !== confirmNewPassword.value) {
            result = {
                mismatchedPasswords: true
            };
        }
        if (oldPassword.value === newPassword.value) {
            result = {
                oldSameNew: true
            };
        }
        return result;
    }

    changePassword($event, values: any): void {
        this.userService.changePassword(values).subscribe(() => {
        }, (error: any) => {
            console.log(error);
            this.changePasswordForm.setErrors({'wrongOldPassword': true});
        });
    }

    close(): void {
        // DRY
        this.location.back();
    }


}
