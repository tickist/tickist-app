(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["modules-forgot-password-forgot-password-module"],{

/***/ "./node_modules/raw-loader/index.js!./src/app/modules/forgot-password/pages/forgot-password/forgot-password.component.html":
/*!************************************************************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/app/modules/forgot-password/pages/forgot-password/forgot-password.component.html ***!
  \************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<p>forgot password</p>\n"

/***/ }),

/***/ "./src/app/modules/forgot-password/forgot-password-routing.module.ts":
/*!***************************************************************************!*\
  !*** ./src/app/modules/forgot-password/forgot-password-routing.module.ts ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var router_1 = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
var forgot_password_1 = __webpack_require__(/*! ./pages/forgot-password */ "./src/app/modules/forgot-password/pages/forgot-password/index.ts");
var routes = [
    {
        path: '',
        component: forgot_password_1.ForgotPasswordComponent,
        outlet: 'content'
    }
];
var TickistForgotPasswordRoutingModule = /** @class */ (function () {
    function TickistForgotPasswordRoutingModule() {
    }
    TickistForgotPasswordRoutingModule = tslib_1.__decorate([
        core_1.NgModule({
            imports: [router_1.RouterModule.forChild(routes)],
            exports: [router_1.RouterModule]
        })
    ], TickistForgotPasswordRoutingModule);
    return TickistForgotPasswordRoutingModule;
}());
exports.TickistForgotPasswordRoutingModule = TickistForgotPasswordRoutingModule;


/***/ }),

/***/ "./src/app/modules/forgot-password/forgot-password.module.ts":
/*!*******************************************************************!*\
  !*** ./src/app/modules/forgot-password/forgot-password.module.ts ***!
  \*******************************************************************/
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
var forgot_password_1 = __webpack_require__(/*! ./pages/forgot-password */ "./src/app/modules/forgot-password/pages/forgot-password/index.ts");
var forgot_password_routing_module_1 = __webpack_require__(/*! ./forgot-password-routing.module */ "./src/app/modules/forgot-password/forgot-password-routing.module.ts");
var TickistForgotPasswordModule = /** @class */ (function () {
    function TickistForgotPasswordModule() {
    }
    TickistForgotPasswordModule = tslib_1.__decorate([
        core_1.NgModule({
            imports: [common_1.CommonModule, material_module_1.TickistMaterialModule, forms_1.FormsModule, flex_layout_1.FlexLayoutModule,
                forms_1.ReactiveFormsModule, forgot_password_routing_module_1.TickistForgotPasswordRoutingModule, shared_module_1.TickistSharedModule],
            providers: [],
            exports: [forgot_password_1.ForgotPasswordComponent],
            declarations: [
                forgot_password_1.ForgotPasswordComponent
            ]
        })
    ], TickistForgotPasswordModule);
    return TickistForgotPasswordModule;
}());
exports.TickistForgotPasswordModule = TickistForgotPasswordModule;


/***/ }),

/***/ "./src/app/modules/forgot-password/pages/forgot-password/forgot-password.component.scss":
/*!**********************************************************************************************!*\
  !*** ./src/app/modules/forgot-password/pages/forgot-password/forgot-password.component.scss ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL21vZHVsZXMvZm9yZ290LXBhc3N3b3JkL3BhZ2VzL2ZvcmdvdC1wYXNzd29yZC9mb3Jnb3QtcGFzc3dvcmQuY29tcG9uZW50LnNjc3MifQ== */"

/***/ }),

/***/ "./src/app/modules/forgot-password/pages/forgot-password/forgot-password.component.ts":
/*!********************************************************************************************!*\
  !*** ./src/app/modules/forgot-password/pages/forgot-password/forgot-password.component.ts ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var ForgotPasswordComponent = /** @class */ (function () {
    function ForgotPasswordComponent() {
    }
    ForgotPasswordComponent.prototype.ngOnInit = function () {
    };
    ForgotPasswordComponent = tslib_1.__decorate([
        core_1.Component({
            selector: 'app-forgot-password',
            template: __webpack_require__(/*! raw-loader!./forgot-password.component.html */ "./node_modules/raw-loader/index.js!./src/app/modules/forgot-password/pages/forgot-password/forgot-password.component.html"),
            styles: [__webpack_require__(/*! ./forgot-password.component.scss */ "./src/app/modules/forgot-password/pages/forgot-password/forgot-password.component.scss")]
        }),
        tslib_1.__metadata("design:paramtypes", [])
    ], ForgotPasswordComponent);
    return ForgotPasswordComponent;
}());
exports.ForgotPasswordComponent = ForgotPasswordComponent;


/***/ }),

/***/ "./src/app/modules/forgot-password/pages/forgot-password/index.ts":
/*!************************************************************************!*\
  !*** ./src/app/modules/forgot-password/pages/forgot-password/index.ts ***!
  \************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
tslib_1.__exportStar(__webpack_require__(/*! ./forgot-password.component */ "./src/app/modules/forgot-password/pages/forgot-password/forgot-password.component.ts"), exports);


/***/ })

}]);
//# sourceMappingURL=modules-forgot-password-forgot-password-module.js.map