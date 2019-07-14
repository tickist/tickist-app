import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TickistMaterialModule} from '../../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FlexLayoutModule} from '@angular/flex-layout';
import {ColorPickerComponent} from './components/color-picker/color-picker.component';
import {ProjectComponent} from './pages/project-component/project.component';
import {TickistSharedModule} from '../../shared/shared.module';
import {TickistEditProjectRoutingModule} from './edit-project-routing.module';
import { DeleteUserConfirmationDialogComponent } from './components/delete-user-confirmation-dialog/delete-user-confirmation-dialog.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';


@NgModule({
    imports: [CommonModule,
        TickistMaterialModule,
        FormsModule,
        FlexLayoutModule,
        ReactiveFormsModule,
        TickistSharedModule,
        TickistEditProjectRoutingModule,
        FontAwesomeModule
    ],
    providers: [],
    entryComponents: [DeleteUserConfirmationDialogComponent],
    exports: [ProjectComponent],
    declarations: [
        ColorPickerComponent,   ProjectComponent, DeleteUserConfirmationDialogComponent
    ]
})
export class TickistEditProjectModule {
}
