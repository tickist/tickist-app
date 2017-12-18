import {Component, OnInit} from '@angular/core';
import {UserService} from '../services/userService'
import {Response} from '@angular/http';
import {UserLogin} from '../models/user';
import {Router} from '@angular/router';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  constructor(fb: FormBuilder, protected router: Router, private userService: UserService) {
    this.loginForm = fb.group({
      'email': ['', [Validators.required, Validators.email]],
      'password': ['', Validators.required]
    });
  }

  ngOnInit() {
  }

  getErrorMessage() {
    return this.loginForm.controls['email'].hasError('required') ? 'You must enter a value' :
      this.loginForm.controls['email'].hasError('email') ? 'Not a valid email' :
        '';
  }

  onSubmit(values: any) {
    console.log(values);
    this.userService.login(values).subscribe(
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
