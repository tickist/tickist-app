import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TickistMaterialModule} from '../../material.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TickistEditUserSettingsRoutingModule} from './edit-user-settings-routing.module';
import {UserComponent} from './components/user/user.component';
import {CalendarModule} from 'primeng/primeng';
import {TickistSharedModule} from '../../shared/shared.module';


@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FormsModule,
        FlexLayoutModule,
        TickistSharedModule,
        ReactiveFormsModule,
        TickistEditUserSettingsRoutingModule,
        CalendarModule
    ],
    providers: [],
    exports: [
        UserComponent
    ],
    declarations: [
        UserComponent
    ]
})
export class TickistEditUserSettingsModule {
}
