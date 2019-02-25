import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TickistMaterialModule} from '../../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TickistSharedModule} from '../../shared/shared.module';
import {SortablejsModule} from 'angular-sortablejs';

import {ForgotPasswordComponent} from './pages/forgot-password';
import {TickistForgotPasswordRoutingModule} from './forgot-password-routing.module';


@NgModule({
    imports: [CommonModule, TickistMaterialModule, FormsModule, FlexLayoutModule,
        ReactiveFormsModule, TickistForgotPasswordRoutingModule, TickistSharedModule, SortablejsModule],
    providers: [],
    exports: [ForgotPasswordComponent],
    declarations: [
        ForgotPasswordComponent
    ]
})
export class TickistForgotPasswordModule {
}
