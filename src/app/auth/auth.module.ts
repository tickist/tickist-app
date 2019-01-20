import {NgModule} from '@angular/core';
import {StoreModule} from '@ngrx/store';

import * as from from './auth.reducer';
import {EffectsModule} from '@ngrx/effects';
import {AuthEffects} from './auth.effects';
import {AuthService} from './auth.service';
import {LoginComponent} from './login';
import {SignupComponent} from './signup/signup.component';
import {ForgotPasswordComponent} from './forgot-password';
import {CommonModule} from '@angular/common';
import {TickistMaterialModule} from '../material.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {ReactiveFormsModule} from '@angular/forms';
import {NavBarLandingPageComponent} from './nav-bar-landing-page/nav-bar-landing-page.component';
import {RouterModule} from '@angular/router';

@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FlexLayoutModule,
        ReactiveFormsModule,
        RouterModule,
        StoreModule.forFeature('auth', from.authReducer),
        EffectsModule.forFeature([AuthEffects])],
    declarations: [NavBarLandingPageComponent, LoginComponent, SignupComponent, ForgotPasswordComponent],
    providers: [AuthService],
    entryComponents: [],
    exports: [NavBarLandingPageComponent, LoginComponent, SignupComponent, ForgotPasswordComponent]
})
export class TickistAuthModule {
}
