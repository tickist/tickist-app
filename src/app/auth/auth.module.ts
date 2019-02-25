import {NgModule} from '@angular/core';
import {StoreModule} from '@ngrx/store';

import * as from from '../core/reducers/auth.reducer';
import {EffectsModule} from '@ngrx/effects';
import {AuthEffects} from '../core/effects/auth.effects';
import {AuthService} from '../core/services/auth.service';
import {LoginComponent} from '../modules/login/pages/login';
import {SignupComponent} from '../modules/signup/pages/signup/signup.component';
import {ForgotPasswordComponent} from '../modules/forgot-password/pages/forgot-password';
import {CommonModule} from '@angular/common';
import {TickistMaterialModule} from '../material.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {ReactiveFormsModule} from '@angular/forms';
import {NavBarAuthPageComponent} from '../core/header/nav-bar-auth-page/nav-bar-auth-page.component';
import {RouterModule} from '@angular/router';

@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FlexLayoutModule,
        ReactiveFormsModule,
        RouterModule],
    declarations: [],
    providers: [],
    entryComponents: [],
    exports: []
})
export class TickistAuthModule {
}
