import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TickistMaterialModule} from '../../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TickistSharedModule} from '../../shared/shared.module';
import {SignupComponent} from './pages/signup/signup.component';
import {TickistSignUpRoutingModule} from './signup-routing.module';
import {IconsModule} from '../../icons.module';


@NgModule({
    imports: [CommonModule, TickistMaterialModule, FormsModule, FlexLayoutModule,
        ReactiveFormsModule, TickistSignUpRoutingModule, TickistSharedModule, IconsModule],
    providers: [],
    exports: [SignupComponent],
    declarations: [
        SignupComponent
    ]
})
export class TickistSignUpModule {
}
