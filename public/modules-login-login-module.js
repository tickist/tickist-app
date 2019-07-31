(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["modules-login-login-module"],{

/***/ "./node_modules/raw-loader/index.js!./src/app/modules/login/pages/login/login.component.html":
/*!******************************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/app/modules/login/pages/login/login.component.html ***!
  \******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div id=\"login-container\" class=\"flex-container\" fxLayoutAlign=\"center center\" fxLayout=\"row\">\n\n    <mat-card fxLayoutAlign=\"center center\" fxLayout=\"column\">\n        <img class=\"logo\" mat-card-image src=\"/assets/images/logo_230.png\" alt=\"Tickist logo\">\n        <form novalidate autocomplete=\"off\" [formGroup]=\"loginForm\" (ngSubmit)=\"onSubmit(loginForm.value)\"\n              fxLayoutAlign=\"center none\" fxLayout=\"column\">\n\n            <mat-form-field>\n                <input name=\"email\" matInput placeholder=\"Email\" formControlName=\"email\">\n                <mat-error *ngIf=\"loginForm.controls['email'].invalid\">{{getErrorMessage()}}</mat-error>\n            </mat-form-field>\n\n\n            <mat-form-field>\n                <input name=\"password\" matInput type=\"password\" placeholder=\"Password\" formControlName=\"password\">\n                <mat-error *ngIf=\"loginForm.controls['password'].hasError('required')\">Password is required</mat-error>\n                <mat-error *ngIf=\"loginForm.controls['password'].hasError('incorrectLoginPassword')\">Login or password\n                    are incorrect\n                </mat-error>\n            </mat-form-field>\n\n\n            <div class=\"login-button-container\">\n                <button id=\"submit-button\" fxFlex mat-button class=\"button\" type=\"submit\">Login\n                </button>\n            </div>\n\n            <!--<div fxLayout=\"row\">-->\n            <!--<button mat-button type=\"button\">Google</button>-->\n            <!--<button mat-button type=\"button\">Facebook</button>-->\n            <!--</div>-->\n\n\n            <!--<span [routerLink]=\"['/forgot-password']\">Forgot password?</span>-->\n            <div class=\"sign-up-text-container\">\n                <span class=\"sign-up-text\" [routerLink]=\"['/signup']\"> Don't have an account? Sign up</span>\n            </div>\n\n        </form>\n    </mat-card>\n</div>\n"

/***/ }),

/***/ "./src/app/modules/login/login-routing.module.ts":
/*!*******************************************************!*\
  !*** ./src/app/modules/login/login-routing.module.ts ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var router_1 = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
var login_1 = __webpack_require__(/*! ./pages/login */ "./src/app/modules/login/pages/login/index.ts");
var routes = [
    {
        path: '',
        component: login_1.LoginComponent,
        outlet: 'content'
    }
];
var TickistLoginRoutingModule = /** @class */ (function () {
    function TickistLoginRoutingModule() {
    }
    TickistLoginRoutingModule = tslib_1.__decorate([
        core_1.NgModule({
            imports: [router_1.RouterModule.forChild(routes)],
            exports: [router_1.RouterModule]
        })
    ], TickistLoginRoutingModule);
    return TickistLoginRoutingModule;
}());
exports.TickistLoginRoutingModule = TickistLoginRoutingModule;


/***/ }),

/***/ "./src/app/modules/login/login.module.ts":
/*!***********************************************!*\
  !*** ./src/app/modules/login/login.module.ts ***!
  \***********************************************/
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
var login_1 = __webpack_require__(/*! ./pages/login */ "./src/app/modules/login/pages/login/index.ts");
var login_routing_module_1 = __webpack_require__(/*! ./login-routing.module */ "./src/app/modules/login/login-routing.module.ts");
var TickistLoginModule = /** @class */ (function () {
    function TickistLoginModule() {
    }
    TickistLoginModule = tslib_1.__decorate([
        core_1.NgModule({
            imports: [common_1.CommonModule, material_module_1.TickistMaterialModule, forms_1.FormsModule, flex_layout_1.FlexLayoutModule,
                forms_1.ReactiveFormsModule, login_routing_module_1.TickistLoginRoutingModule, shared_module_1.TickistSharedModule],
            providers: [],
            exports: [login_1.LoginComponent],
            declarations: [
                login_1.LoginComponent
            ]
        })
    ], TickistLoginModule);
    return TickistLoginModule;
}());
exports.TickistLoginModule = TickistLoginModule;


/***/ }),

/***/ "./src/app/modules/login/pages/login/index.ts":
/*!****************************************************!*\
  !*** ./src/app/modules/login/pages/login/index.ts ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
tslib_1.__exportStar(__webpack_require__(/*! ./login.component */ "./src/app/modules/login/pages/login/login.component.ts"), exports);


/***/ }),

/***/ "./src/app/modules/login/pages/login/login.component.scss":
/*!****************************************************************!*\
  !*** ./src/app/modules/login/pages/login/login.component.scss ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ":host {\n  display: flex;\n  flex-direction: column;\n  min-height: 100%;\n  display: -webkit-box;\n  display: flex;\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n  -webkit-box-flex: 1;\n          flex: 1; }\n\n#login-container {\n  width: 100%;\n  height: 100%; }\n\n#login-container mat-card {\n    width: 300px; }\n\n.sign-up-text-container {\n  padding: 16px 0 16px 0; }\n\n.sign-up-text-container .sign-up-text {\n    cursor: pointer;\n    font-size: 12px; }\n\n.login-button-container {\n  padding: 16px 0 16px 0;\n  width: 100%; }\n\n.login-button-container .button {\n    background-color: #fcb150; }\n\n.logo {\n  padding-top: 16px;\n  height: 97px;\n  width: 230px; }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2Jib3J6dWNraS93b3Jrc3BhY2UvdGlja2lzdC1kZXZlbG9wbWVudC9mcm9udGVuZC9zcmMvYXBwL21vZHVsZXMvbG9naW4vcGFnZXMvbG9naW4vbG9naW4uY29tcG9uZW50LnNjc3MiLCIvaG9tZS9iYm9yenVja2kvd29ya3NwYWNlL3RpY2tpc3QtZGV2ZWxvcG1lbnQvZnJvbnRlbmQvc3JjL2FwcC9zaGFyZWQvdmFyaWFibGVzLnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7RUFDSSxhQUFhO0VBQ2Isc0JBQXNCO0VBQ3RCLGdCQUFnQjtFQUNoQixvQkFBb0I7RUFFcEIsYUFBYTtFQUNiLDRCQUE0QjtFQUM1Qiw2QkFBNkI7RUFFN0IsbUJBQU87VUFBUCxPQUFPLEVBQUE7O0FBSVg7RUFDSSxXQUFXO0VBQ1gsWUFBWSxFQUFBOztBQUZoQjtJQUlRLFlBQVksRUFBQTs7QUFHcEI7RUFDSSxzQkFBc0IsRUFBQTs7QUFEMUI7SUFHUSxlQUFlO0lBQ2YsZUFBZSxFQUFBOztBQU12QjtFQUNJLHNCQUFzQjtFQUN0QixXQUFXLEVBQUE7O0FBRmY7SUFJUSx5QkMzQlEsRUFBQTs7QUQrQmhCO0VBQ0ksaUJBQWlCO0VBQ2pCLFlBQVk7RUFDWixZQUFZLEVBQUEiLCJmaWxlIjoic3JjL2FwcC9tb2R1bGVzL2xvZ2luL3BhZ2VzL2xvZ2luL2xvZ2luLmNvbXBvbmVudC5zY3NzIiwic291cmNlc0NvbnRlbnQiOlsiQGltcG9ydCBcIi4uLy4uLy4uLy4uL3NoYXJlZC92YXJpYWJsZXNcIjtcblxuOmhvc3Qge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBtaW4taGVpZ2h0OiAxMDAlO1xuICAgIGRpc3BsYXk6IC13ZWJraXQtYm94O1xuICAgIGRpc3BsYXk6IC1tcy1mbGV4Ym94O1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgLXdlYmtpdC1ib3gtb3JpZW50OiB2ZXJ0aWNhbDtcbiAgICAtd2Via2l0LWJveC1kaXJlY3Rpb246IG5vcm1hbDtcbiAgICAtbXMtZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBmbGV4OiAxO1xufVxuXG5cbiNsb2dpbi1jb250YWluZXIge1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIGhlaWdodDogMTAwJTtcbiAgICBtYXQtY2FyZCB7XG4gICAgICAgIHdpZHRoOiAzMDBweDtcbiAgICB9XG59XG4uc2lnbi11cC10ZXh0LWNvbnRhaW5lciB7XG4gICAgcGFkZGluZzogMTZweCAwIDE2cHggMDtcbiAgICAuc2lnbi11cC10ZXh0IHtcbiAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgfVxufVxuXG5cblxuLmxvZ2luLWJ1dHRvbi1jb250YWluZXIge1xuICAgIHBhZGRpbmc6IDE2cHggMCAxNnB4IDA7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgLmJ1dHRvbiB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICRvcmFuZ2U7XG4gICAgfVxufVxuXG4ubG9nbyB7XG4gICAgcGFkZGluZy10b3A6IDE2cHg7XG4gICAgaGVpZ2h0OiA5N3B4O1xuICAgIHdpZHRoOiAyMzBweDtcbn1cbiIsIi8vdmFyaWFibGVzXG5cbi8vcHJpb3JpdHlcbiRwcmlvcml0eV9BOiAjY2MzMjRiO1xuJHByaW9yaXR5X0I6ICNGRjk5QjI7XG4kcHJpb3JpdHlfQzogI2ZmZmZmZjtcbiR3aGl0ZTogd2hpdGU7XG4kZ3JheTogZ3JheTtcbiRyZWQ6ICNkOTUzNGY7XG4kYmxhY2s6IGJsYWNrO1xuJG9yYW5nZTogI2ZjYjE1MDtcbiRncmVlbjogIzExYThhYjtcbiRiYWNrZ3JvdW5kX2NvbG9yOiAjMWYyNTNkO1xuJGJhY2tncm91bmRfY2FyZF9jb2xvcjogIzM5NDI2NDtcbiRpbnB1dF9iYWNrZ3JvdW5kOiAjNTA1OTdiO1xuJG1haW5fYmFja2dyb3VuZDogIzFGMjUzRDtcbiRwcm9ncmVzc19iYXJfY29sb3I6ICNjYzMyNGI7XG5cbi8vaGVpZ2h0IG9mIHRoZSBlbGVtZW50XG4kbWluLWhlaWdodDogY2FsYygxMDAlIC0gNTZweCk7XG4iXX0= */"

/***/ }),

/***/ "./src/app/modules/login/pages/login/login.component.ts":
/*!**************************************************************!*\
  !*** ./src/app/modules/login/pages/login/login.component.ts ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var router_1 = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
var forms_1 = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm5/forms.js");
var store_1 = __webpack_require__(/*! @ngrx/store */ "./node_modules/@ngrx/store/fesm5/store.js");
var auth_actions_1 = __webpack_require__(/*! ../../../../core/actions/auth.actions */ "./src/app/core/actions/auth.actions.ts");
var auth_service_1 = __webpack_require__(/*! ../../../../core/services/auth.service */ "./src/app/core/services/auth.service.ts");
var LoginComponent = /** @class */ (function () {
    function LoginComponent(router, authService, store) {
        var _this = this;
        this.router = router;
        this.authService = authService;
        this.store = store;
        this.loginForm = new forms_1.FormGroup({
            'email': new forms_1.FormControl('', [forms_1.Validators.required, forms_1.Validators.email]),
            'password': new forms_1.FormControl('', forms_1.Validators.required)
        });
        this.loginForm.controls['email'].valueChanges.subscribe(function () {
            _this.resetValidationError();
        });
        this.loginForm.controls['password'].valueChanges.subscribe(function () {
            _this.resetValidationError();
        });
    }
    LoginComponent.prototype.resetValidationError = function () {
        this.loginForm.controls['email'].setErrors(null);
        this.loginForm.controls['password'].setErrors(null);
    };
    LoginComponent.prototype.getErrorMessage = function () {
        return this.loginForm.controls['email'].hasError('required') ? 'You must enter a value' :
            this.loginForm.controls['email'].hasError('email') ? 'Not a valid email' :
                '';
    };
    LoginComponent.prototype.onSubmit = function (values) {
        var _this = this;
        this.authService.login(values)
            .then(function (user) {
            console.log(user);
            _this.store.dispatch(new auth_actions_1.Login({ uid: user.user.uid }));
        })
            .catch(function (err) { return console.log(err.message); });
        // .pipe(
        //     tap((token: IToken) => {
        //         this.store.dispatch(new Login({token: new Token(token)} ));
        //     })
        // )
        // .subscribe(
        // noop,
        // (err: any) => { // on error
        //     this.loginForm.controls['email'].setErrors({'incorrectLoginPassword': true});
        //     this.loginForm.controls['password'].setErrors({'incorrectLoginPassword': true});
        // },
        // () => { // on completion
        //
        // }
    };
    LoginComponent.ctorParameters = function () { return [
        { type: router_1.Router },
        { type: auth_service_1.AuthService },
        { type: store_1.Store }
    ]; };
    LoginComponent = tslib_1.__decorate([
        core_1.Component({
            selector: 'app-login',
            template: __webpack_require__(/*! raw-loader!./login.component.html */ "./node_modules/raw-loader/index.js!./src/app/modules/login/pages/login/login.component.html"),
            styles: [__webpack_require__(/*! ./login.component.scss */ "./src/app/modules/login/pages/login/login.component.scss")]
        }),
        tslib_1.__metadata("design:paramtypes", [router_1.Router, auth_service_1.AuthService, store_1.Store])
    ], LoginComponent);
    return LoginComponent;
}());
exports.LoginComponent = LoginComponent;


/***/ })

}]);
//# sourceMappingURL=modules-login-login-module.js.map