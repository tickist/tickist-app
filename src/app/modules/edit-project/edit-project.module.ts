import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TickistMaterialModule} from '../../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FlexLayoutModule} from '@angular/flex-layout';
import {ColorPickerComponent} from './components/color-picker/color-picker.component';
import {ProjectComponent} from './components/project-component/project.component';
import {TickistSharedModule} from '../../shared/shared.module';
import {TickistEditProjectRoutingModule} from './edit-project-routing.module';


@NgModule({
    imports: [CommonModule,
        TickistMaterialModule,
        FormsModule,
        FlexLayoutModule,
        ReactiveFormsModule,
        TickistSharedModule,
        TickistEditProjectRoutingModule
    ],
    providers: [],
    exports: [ProjectComponent],
    declarations: [
        ColorPickerComponent,   ProjectComponent
    ]
})
export class TickistEditProjectModule {
}
