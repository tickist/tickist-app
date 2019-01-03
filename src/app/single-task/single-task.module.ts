import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TickistMaterialModule} from '../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FlexLayoutModule} from '@angular/flex-layout';
import {UserAvatarComponent} from '../user-avatar/user-avatar.component';
import {ProgressBarComponent} from './progress-bar/progress-bar.component';
import {PinButtonComponent} from './pin-button/pin-button.component';
import {RightMenuComponent} from './right-menu/right-menu.component';
import {ToggleButtonComponent} from './toggle-button/toggle-button.component';
import {TaskNameComponent} from './task-name/task-name.component';
import {DisplayFinishDateComponent} from './display-finish-date/display-finish-date.component';
import {TickistSharedModule} from '../shared/shared.module';
import {EditRepeatingOptionComponent} from '../edit-repeating-options/edit-repeating-option.component';
import {DateOptionsComponent} from '../date-options/date-options.component';
import {RouterModule} from '@angular/router';
import {SingleTaskComponent} from './single-task/single-task.component';
import {SingleTaskSimplifiedComponent} from './single-task-simplified/single-task-simplified.component';
import {SingleTaskExtendedComponent} from './single-task-extended/single-task-extended.component';

@NgModule({
    imports: [ CommonModule, TickistMaterialModule, FormsModule, FlexLayoutModule,
        ReactiveFormsModule, TickistSharedModule, RouterModule],
    providers: [
    ],
    exports: [SingleTaskComponent,
        SingleTaskSimplifiedComponent,  UserAvatarComponent,
        ProgressBarComponent,
        PinButtonComponent,
        RightMenuComponent,  ToggleButtonComponent,  TaskNameComponent,  DisplayFinishDateComponent, EditRepeatingOptionComponent,
        DateOptionsComponent],
    declarations: [SingleTaskComponent,
        SingleTaskSimplifiedComponent,  UserAvatarComponent,
        ProgressBarComponent,
        PinButtonComponent,
        RightMenuComponent,  ToggleButtonComponent,  TaskNameComponent,  DisplayFinishDateComponent, EditRepeatingOptionComponent,
        DateOptionsComponent,
        SingleTaskExtendedComponent]
})
export class TickistSingleTaskModule {
}