import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TickistMaterialModule} from '../../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TickistSharedModule} from '../../shared/shared.module';
import {LoginComponent} from './pages/login';
import {TickistLoginRoutingModule} from './login-routing.module';
import {IconsModule} from '../../icons.module';


@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FormsModule,
        FlexLayoutModule,
        ReactiveFormsModule,
        TickistLoginRoutingModule,
        TickistSharedModule,
        IconsModule
    ],
    providers: [],
    exports: [
        LoginComponent],
    declarations: [
        LoginComponent
    ]
})
export class TickistLoginModule {
}
