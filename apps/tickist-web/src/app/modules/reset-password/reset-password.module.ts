import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TickistMaterialModule} from '../../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TickistSharedModule} from '../../shared/shared.module';
import {ResetPasswordComponent} from './pages/reset-password';
import {TickistResetPasswordRoutingModule} from './reset-password-routing.module';
import { RequestResetPasswordComponent } from './pages/request-reset-password/request-reset-password.component';


@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FormsModule,
        FlexLayoutModule,
        ReactiveFormsModule,
        TickistResetPasswordRoutingModule,
        TickistSharedModule
    ],
    providers: [],
    exports: [
        ResetPasswordComponent,
        RequestResetPasswordComponent
    ],
    declarations: [
        ResetPasswordComponent,
        RequestResetPasswordComponent
    ]
})
export class TickistResetPasswordModule {
}
