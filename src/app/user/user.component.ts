import {Component, OnInit, ElementRef, Renderer, ViewChild, OnDestroy} from '@angular/core';
import {User} from '../models/user';
import {UserService} from '../services/userService';
import {FormBuilder, FormGroup, FormControl, Validators, AbstractControl} from '@angular/forms';
import {Location} from '@angular/common';
import {ConfigurationService} from '../services/configurationService';
import {environment} from '../../environments/environment';

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
  @ViewChild('changeAvatarInput') changeAvatarInput: ElementRef;

  constructor(private fb: FormBuilder, private userService: UserService, private location: Location,
              protected configurationService: ConfigurationService, private renderer: Renderer) {

    this.staticUrl = environment['staticUrl'];
    this.tasksOrderOptions = this.configurationService.loadConfiguration()['commons']['TASKS_ORDER_OPTIONS'];
    this.defaultTaskViewOptions = this.configurationService.loadConfiguration()['commons']['DEFAULT_TASK_VIEW_OPTIONS'];
    this.menu = {
      'main': true, 'password': false, 'notifications': false, 'settings': false
    };
     this.changePasswordForm = this.fb.group({
      'oldPassword': ['', Validators.compose([Validators.required, Validators.minLength(4)])],
      'newPassword': ['', Validators.compose([Validators.required, Validators.minLength(4)])],
      'confirmNewPassword': ['', Validators.compose([Validators.required, Validators.minLength(4)])]
    }, {validator: this.matchingPasswords});

  }


  ngOnInit() {
    this.userService.user$.subscribe((user) => {
      if (user) {
        this.user = user;
         this.dailySummaryCheckbox = ((user.dailySummaryHour) ? true : false);
         this.userData = this.fb.group({
            'username': [user.username, Validators.compose([Validators.required, Validators.minLength(4)])],
            'email': [user.email, Validators.compose([Validators.required, Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$')])],
           })
      }
    });
    this.configurationService.changeOpenStateLeftSidenavVisibility('close');
    this.configurationService.changeOpenStateRightSidenavVisibility('close');
  }

  ngOnDestroy() {
    this.configurationService.updateLeftSidenavVisibility();
    this.configurationService.updateRightSidenavVisibility();
  }

  toggleDailySumary() {
      this.dailySummaryCheckbox = !this.dailySummaryCheckbox;
      if (this.dailySummaryCheckbox) {
          this.user.dailySummaryHour = null;
      } else {
          var d = new Date();
          d.setHours(7, 0);
          d.setMinutes(0);
         this.user.dailySummaryHour = d;
      }
      this.changeUserDetails()
  };



  changeAvatarTrigger() {
    let clickEvent = new MouseEvent('click', {bubbles: true});
    this.renderer.invokeElementMethod(this.changeAvatarInput.nativeElement,
      'dispatchEvent', [clickEvent]);
  }

  changeAvatar(event: any) {
    let file = event.target.files[0];
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
  };

  checkActiveItemInMenu(menu_item) {
    // DRY
    return this.menu[menu_item];
  };
  changeUserDetails() {
    this.userService.updateUser(this.user);
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
  changePassword($event, values: any) {
    this.userService.changePassword(values).subscribe(() => {
    }, (error: any) => {
      console.log(error);
      this.changePasswordForm.setErrors({'wrongOldPassword': true});
    });
  }
  close() {
    // DRY
    this.location.back();
  }





}
