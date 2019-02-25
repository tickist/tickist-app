import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TickistMaterialModule} from '../../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TickistSharedModule} from '../../shared/shared.module';
import {SortablejsModule} from 'angular-sortablejs';
import {SignupComponent} from './pages/signup/signup.component';
import {TickistSignupRoutingModule} from './signup-routing.module';


@NgModule({
    imports: [CommonModule, TickistMaterialModule, FormsModule, FlexLayoutModule,
        ReactiveFormsModule, TickistSignupRoutingModule, TickistSharedModule, SortablejsModule],
    providers: [],
    exports: [SignupComponent],
    declarations: [
        SignupComponent
    ]
})
export class TickistSignupModule {
}
