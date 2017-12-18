import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  AbstractControl
 } from '@angular/forms';
import {UserService} from '../services/userService';
import {Router} from '@angular/router';
import {Headers, RequestOptions, Response, RequestOptionsArgs} from '@angular/http';

class User {
  username: string;
  email: string;
  password: string;
}


@Component({
  selector: 'tickist-sign-up',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  model = new User();
  userForm: FormGroup;

  constructor(fb: FormBuilder, private userService: UserService, protected router: Router) {
    this.userForm = fb.group({
      'username': ['', Validators.required],
      'email': ['', [Validators.required, Validators.email], this.validateEmailNotTaken.bind(this)],
      'password': ['', Validators.required]
    });
  }

  ngOnInit() {
  }

  validateEmailNotTaken(control: AbstractControl) {
    return this.userService.checkEmail(control.value).map(res => {
      if (res['is_taken']) {
        return { emailTaken: true };
      }
    });
  }

  onSubmit(values: any): void {
    this.userService.signup(values).subscribe(
      (response: Response) => { // on sucesss
          console.log(response);
          this.router.navigate(['home']);
        },
        (err: any) => { // on error
          console.log(err);
        },
        () => { // on completion

        }
    );
  }

}
