(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["modules-signup-signup-module"],{

/***/ "./node_modules/raw-loader/index.js!./src/app/modules/signup/pages/signup/signup.component.html":
/*!*********************************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/app/modules/signup/pages/signup/signup.component.html ***!
  \*********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div id=\"signup-container\" class=\"flex-container\" fxLayoutAlign=\"center center\" fxLayout=\"row\">\n\n    <mat-card fxLayoutAlign=\"center center\" fxLayout=\"column\">\n        <img class=\"logo\" mat-card-image src=\"/assets/images/logo_230.png\" alt=\"Tickist logo\">\n        <form novalidate autocomplete=\"off\" [formGroup]=\"userForm\" (ngSubmit)=\"onSubmit(userForm.value)\"\n              fxLayoutAlign=\"center center\" fxLayout=\"column\">\n\n            <mat-form-field>\n                <input name=\"username\" matInput placeholder=\"Username\" formControlName=\"username\">\n                <mat-error\n                    *ngIf=\"userForm.controls['username'].hasError('required') && userForm.controls['username'].touched\">\n                    Name is required\n                </mat-error>\n            </mat-form-field>\n\n            <mat-form-field>\n                <input name=\"email\" matInput placeholder=\"Email\" formControlName=\"email\">\n                <mat-error\n                    *ngIf=\"!userForm.controls['email'].hasError('required') && userForm.controls['email'].hasError('email') && userForm.controls['email'].touched\">\n                    Email address is invalid\n                </mat-error>\n                <mat-error\n                    *ngIf=\"userForm.controls['email'].hasError('required') && userForm.controls['email'].touched\">\n                    Email is required\n                </mat-error>\n                <mat-error\n                    *ngIf=\"userForm.controls['email'].hasError('emailTaken') && userForm.controls['email'].touched\">\n                    This email is already taken!\n                </mat-error>\n            </mat-form-field>\n\n\n            <mat-form-field>\n                <input name=\"password\" matInput placeholder=\"Password\" formControlName=\"password\" type=\"password\">\n                <mat-error\n                    *ngIf=\"userForm.controls['password'].hasError('required') && userForm.controls['password'].touched\">\n                    Password is required\n                </mat-error>\n            </mat-form-field>\n\n            <div class=\"submit-button-container\">\n                <button id=\"submit-button\" fxFlex class=\"button\" mat-button type=\"submit\">Sign up for free</button>\n            </div>\n            <!--<div fxLayoutAlign=\"center center\" fxLayout=\"row\">-->\n            <!--<button mat-button type=\"button\"> <span>Google</span></button>-->\n            <!--<button mat-button type=\"button\"> <span>Facebook</span></button>-->\n            <!--</div>-->\n            <!--<div>-->\n            <!--<span [routerLink]=\"['/forgot-password']\">Forgot password</span>-->\n            <!--</div>-->\n            <div class=\"login-text-container\">\n                <span class=\"login-text\" [routerLink]=\"['/login']\">Have you an account? Log in</span>\n            </div>\n\n\n        </form>\n    </mat-card>\n</div>\n"

/***/ }),

/***/ "./src/app/modules/signup/pages/signup/signup.component.scss":
/*!*******************************************************************!*\
  !*** ./src/app/modules/signup/pages/signup/signup.component.scss ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ":host {\n  display: flex;\n  flex-direction: column;\n  min-height: 100%;\n  display: -webkit-box;\n  display: flex;\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n  -webkit-box-flex: 1;\n          flex: 1; }\n\n#signup-container {\n  width: 100%;\n  height: 100%; }\n\n#signup-container mat-card {\n    width: 300px; }\n\n.submit-button-container {\n  width: 100%;\n  padding: 16px 0 16px 0; }\n\n.submit-button-container .button {\n    background-color: #fcb150; }\n\n.login-text-container {\n  padding: 16px 0 16px 0;\n  width: 100%; }\n\n.login-text-container .login-text {\n    cursor: pointer;\n    font-size: 12px; }\n\n.logo {\n  padding-top: 16px;\n  height: 97px;\n  width: 230px; }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2Jib3J6dWNraS93b3Jrc3BhY2UvdGlja2lzdC1kZXZlbG9wbWVudC9mcm9udGVuZC9zcmMvYXBwL21vZHVsZXMvc2lnbnVwL3BhZ2VzL3NpZ251cC9zaWdudXAuY29tcG9uZW50LnNjc3MiLCIvaG9tZS9iYm9yenVja2kvd29ya3NwYWNlL3RpY2tpc3QtZGV2ZWxvcG1lbnQvZnJvbnRlbmQvc3JjL2FwcC9zaGFyZWQvdmFyaWFibGVzLnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7RUFDSSxhQUFhO0VBQ2Isc0JBQXNCO0VBQ3RCLGdCQUFnQjtFQUNoQixvQkFBb0I7RUFFcEIsYUFBYTtFQUNiLDRCQUE0QjtFQUM1Qiw2QkFBNkI7RUFFN0IsbUJBQU87VUFBUCxPQUFPLEVBQUE7O0FBSVg7RUFDSSxXQUFXO0VBQ1gsWUFBWSxFQUFBOztBQUZoQjtJQUtRLFlBQVksRUFBQTs7QUFLcEI7RUFDSSxXQUFXO0VBQ1gsc0JBQXNCLEVBQUE7O0FBRjFCO0lBS1EseUJDckJRLEVBQUE7O0FEeUJoQjtFQUNJLHNCQUFzQjtFQUN0QixXQUFXLEVBQUE7O0FBRmY7SUFJUSxlQUFlO0lBQ2YsZUFBZSxFQUFBOztBQUl2QjtFQUNJLGlCQUFpQjtFQUNqQixZQUFZO0VBQ1osWUFBWSxFQUFBIiwiZmlsZSI6InNyYy9hcHAvbW9kdWxlcy9zaWdudXAvcGFnZXMvc2lnbnVwL3NpZ251cC5jb21wb25lbnQuc2NzcyIsInNvdXJjZXNDb250ZW50IjpbIkBpbXBvcnQgXCIuLi8uLi8uLi8uLi9zaGFyZWQvdmFyaWFibGVzXCI7XG5cbjpob3N0IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgbWluLWhlaWdodDogMTAwJTtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWJveDtcbiAgICBkaXNwbGF5OiAtbXMtZmxleGJveDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIC13ZWJraXQtYm94LW9yaWVudDogdmVydGljYWw7XG4gICAgLXdlYmtpdC1ib3gtZGlyZWN0aW9uOiBub3JtYWw7XG4gICAgLW1zLWZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZmxleDogMTtcbn1cblxuXG4jc2lnbnVwLWNvbnRhaW5lciB7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgaGVpZ2h0OiAxMDAlO1xuXG4gICAgbWF0LWNhcmQge1xuICAgICAgICB3aWR0aDogMzAwcHg7XG4gICAgfVxufVxuXG5cbi5zdWJtaXQtYnV0dG9uLWNvbnRhaW5lciB7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgcGFkZGluZzogMTZweCAwIDE2cHggMDtcblxuICAgIC5idXR0b24ge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAkb3JhbmdlO1xuICAgIH1cbn1cblxuLmxvZ2luLXRleHQtY29udGFpbmVyIHtcbiAgICBwYWRkaW5nOiAxNnB4IDAgMTZweCAwO1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIC5sb2dpbi10ZXh0IHtcbiAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgfVxufVxuXG4ubG9nbyB7XG4gICAgcGFkZGluZy10b3A6IDE2cHg7XG4gICAgaGVpZ2h0OiA5N3B4O1xuICAgIHdpZHRoOiAyMzBweDtcbn1cbiIsIi8vdmFyaWFibGVzXG5cbi8vcHJpb3JpdHlcbiRwcmlvcml0eV9BOiAjY2MzMjRiO1xuJHByaW9yaXR5X0I6ICNGRjk5QjI7XG4kcHJpb3JpdHlfQzogI2ZmZmZmZjtcbiR3aGl0ZTogd2hpdGU7XG4kZ3JheTogZ3JheTtcbiRyZWQ6ICNkOTUzNGY7XG4kYmxhY2s6IGJsYWNrO1xuJG9yYW5nZTogI2ZjYjE1MDtcbiRncmVlbjogIzExYThhYjtcbiRiYWNrZ3JvdW5kX2NvbG9yOiAjMWYyNTNkO1xuJGJhY2tncm91bmRfY2FyZF9jb2xvcjogIzM5NDI2NDtcbiRpbnB1dF9iYWNrZ3JvdW5kOiAjNTA1OTdiO1xuJG1haW5fYmFja2dyb3VuZDogIzFGMjUzRDtcbiRwcm9ncmVzc19iYXJfY29sb3I6ICNjYzMyNGI7XG5cbi8vaGVpZ2h0IG9mIHRoZSBlbGVtZW50XG4kbWluLWhlaWdodDogY2FsYygxMDAlIC0gNTZweCk7XG4iXX0= */"

/***/ }),

/***/ "./src/app/modules/signup/pages/signup/signup.component.ts":
/*!*****************************************************************!*\
  !*** ./src/app/modules/signup/pages/signup/signup.component.ts ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var forms_1 = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm5/forms.js");
var router_1 = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
var store_1 = __webpack_require__(/*! @ngrx/store */ "./node_modules/@ngrx/store/fesm5/store.js");
var auth_service_1 = __webpack_require__(/*! ../../../../core/services/auth.service */ "./src/app/core/services/auth.service.ts");
var SignupComponent = /** @class */ (function () {
    function SignupComponent(authService, router, store) {
        this.authService = authService;
        this.router = router;
        this.store = store;
        this.userForm = new forms_1.FormGroup({
            'username': new forms_1.FormControl('', [forms_1.Validators.required]),
            'email': new forms_1.FormControl('', [forms_1.Validators.required, forms_1.Validators.email], []),
            'password': new forms_1.FormControl('', [forms_1.Validators.required])
        });
    }
    SignupComponent.prototype.ngOnInit = function () {
    };
    SignupComponent.prototype.validateEmailNotTaken = function (control) {
        // @TODO
        // Do the same using Firebase
        // return this.authService.checkEmail(control.value).pipe(map(res => {
        //     if (res['is_taken']) {
        //         return {emailTaken: true};
        //     }
        // }));
    };
    SignupComponent.prototype.onSubmit = function (values) {
        var _this = this;
        this.authService.signup(values)
            .then(function (user) {
            console.log(user);
            // @TODO move to action
            _this.authService.save({ username: values.username, uid: user.user.uid, email: user.user.email });
        })
            .catch(function (err) { return console.log(err.message); });
        //     .pipe(
        //     tap((token: IToken) => {
        //         this.store.dispatch(new Login({token: new Token(token)} ));
        //     })
        // ).subscribe(
        //     noop,
        //     (err: any) => { // on error
        //         console.log(err);
        //     }
        // );
    };
    SignupComponent.ctorParameters = function () { return [
        { type: auth_service_1.AuthService },
        { type: router_1.Router },
        { type: store_1.Store }
    ]; };
    SignupComponent = tslib_1.__decorate([
        core_1.Component({
            selector: 'tickist-sign-up',
            template: __webpack_require__(/*! raw-loader!./signup.component.html */ "./node_modules/raw-loader/index.js!./src/app/modules/signup/pages/signup/signup.component.html"),
            styles: [__webpack_require__(/*! ./signup.component.scss */ "./src/app/modules/signup/pages/signup/signup.component.scss")]
        }),
        tslib_1.__metadata("design:paramtypes", [auth_service_1.AuthService, router_1.Router, store_1.Store])
    ], SignupComponent);
    return SignupComponent;
}());
exports.SignupComponent = SignupComponent;


/***/ }),

/***/ "./src/app/modules/signup/signup-routing.module.ts":
/*!*********************************************************!*\
  !*** ./src/app/modules/signup/signup-routing.module.ts ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var router_1 = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
var signup_component_1 = __webpack_require__(/*! ./pages/signup/signup.component */ "./src/app/modules/signup/pages/signup/signup.component.ts");
var routes = [
    {
        path: '',
        component: signup_component_1.SignupComponent,
        outlet: 'content'
    }
];
var TickistSignupRoutingModule = /** @class */ (function () {
    function TickistSignupRoutingModule() {
    }
    TickistSignupRoutingModule = tslib_1.__decorate([
        core_1.NgModule({
            imports: [router_1.RouterModule.forChild(routes)],
            exports: [router_1.RouterModule]
        })
    ], TickistSignupRoutingModule);
    return TickistSignupRoutingModule;
}());
exports.TickistSignupRoutingModule = TickistSignupRoutingModule;


/***/ }),

/***/ "./src/app/modules/signup/signup.module.ts":
/*!*************************************************!*\
  !*** ./src/app/modules/signup/signup.module.ts ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
var common_1 = __webpack_require__(/*! @angular/common */ "./node_modules/@angular/common/fesm5/common.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var material_module_1 = __webpack_require__(/*! ../../material.module */ "./src/app/material.module.ts");
var forms_1 = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm5/forms.js");
var flex_layout_1 = __webpack_require__(/*! @angular/flex-layout */ "./node_modules/@angular/flex-layout/esm5/flex-layout.es5.js");
var shared_module_1 = __webpack_require__(/*! ../../shared/shared.module */ "./src/app/shared/shared.module.ts");
var signup_component_1 = __webpack_require__(/*! ./pages/signup/signup.component */ "./src/app/modules/signup/pages/signup/signup.component.ts");
var signup_routing_module_1 = __webpack_require__(/*! ./signup-routing.module */ "./src/app/modules/signup/signup-routing.module.ts");
var TickistSignupModule = /** @class */ (function () {
    function TickistSignupModule() {
    }
    TickistSignupModule = tslib_1.__decorate([
        core_1.NgModule({
            imports: [common_1.CommonModule, material_module_1.TickistMaterialModule, forms_1.FormsModule, flex_layout_1.FlexLayoutModule,
                forms_1.ReactiveFormsModule, signup_routing_module_1.TickistSignupRoutingModule, shared_module_1.TickistSharedModule],
            providers: [],
            exports: [signup_component_1.SignupComponent],
            declarations: [
                signup_component_1.SignupComponent
            ]
        })
    ], TickistSignupModule);
    return TickistSignupModule;
}());
exports.TickistSignupModule = TickistSignupModule;


/***/ })

}]);
//# sourceMappingURL=modules-signup-signup-module.js.map