import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TickistMaterialModule} from '../../material.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TickistEditUserSettingsRoutingModule} from './edit-user-settings-routing.module';
import {UserComponent} from './components/user/user.component';
import {TickistSharedModule} from '../../shared/shared.module';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import { DeleteAccountDialogComponent } from './components/delete-account-dialog/delete-account-dialog.component';


@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FormsModule,
        FlexLayoutModule,
        TickistSharedModule,
        ReactiveFormsModule,
        TickistEditUserSettingsRoutingModule,
        FontAwesomeModule
    ],
    providers: [],
    exports: [
        UserComponent
    ],
    declarations: [
        UserComponent,
        DeleteAccountDialogComponent
    ]
})
export class TickistEditUserSettingsModule {
}
