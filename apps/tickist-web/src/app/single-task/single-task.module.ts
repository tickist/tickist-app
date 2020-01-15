import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TickistMaterialModule} from '../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FlexLayoutModule} from '@angular/flex-layout';
import {ProgressBarComponent} from './progress-bar/progress-bar.component';
import {PinButtonComponent} from './pin-button/pin-button.component';
import {RightMenuComponent} from './right-menu/right-menu.component';
import {ToggleButtonComponent} from './toggle-button/toggle-button.component';
import {TaskNameComponent} from './task-name/task-name.component';
import {DisplayFinishDateComponent} from './display-finish-date/display-finish-date.component';
import {TickistSharedModule} from '../shared/shared.module';
import {EditRepeatingOptionComponent} from './edit-repeating-options/edit-repeating-option.component';
import {DateOptionsComponent} from './date-options/date-options.component';
import {RouterModule} from '@angular/router';
import {SingleTaskComponent} from './single-task/single-task.component';
import {SingleTaskSimplifiedComponent} from './single-task-simplified/single-task-simplified.component';
import {SingleTaskExtendedComponent} from './single-task-extended/single-task-extended.component';
import {NoTasksComponent} from './no-tasks/no-tasks.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';

@NgModule({
    imports: [CommonModule, TickistMaterialModule, FormsModule, FlexLayoutModule,
        ReactiveFormsModule, TickistSharedModule, RouterModule, FontAwesomeModule],
    providers: [],
    exports: [SingleTaskComponent,
        SingleTaskSimplifiedComponent,
        ProgressBarComponent,
        PinButtonComponent,
        RightMenuComponent, ToggleButtonComponent, TaskNameComponent, DisplayFinishDateComponent, EditRepeatingOptionComponent,
        DateOptionsComponent, NoTasksComponent],
    declarations: [SingleTaskComponent,
        SingleTaskSimplifiedComponent,
        ProgressBarComponent,
        PinButtonComponent,
        RightMenuComponent, ToggleButtonComponent, TaskNameComponent, DisplayFinishDateComponent, EditRepeatingOptionComponent,
        DateOptionsComponent,
        SingleTaskExtendedComponent, NoTasksComponent]
})
export class TickistSingleTaskModule {
}
