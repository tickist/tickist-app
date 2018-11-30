import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChangeTaskViewComponent} from './change-task-view-component/change-task-view.component';
import {TickistMaterialModule} from '../material.module';
import {FormsModule} from '@angular/forms';
import {ConfigurationService} from '../services/configuration.service';
import {MenuButtonComponent} from './menu-button/menu-button.component';
import {AvatarSize} from './pipes/avatarSize';
import {PriorityComponent} from './priority/priority.component';
import {TruncatePipe} from './pipes/truncate.pipe';
import {Minutes2hoursPipe} from './pipes/minutes2hours';
import {DateToString} from './pipes/datetostring';
import {RepeatString} from './pipes/repeatString';
import {RepeatStringExtension} from './pipes/repeatStringExtension';


@NgModule({
    imports: [ CommonModule, TickistMaterialModule, FormsModule],
    providers: [
        ConfigurationService
    ],
    declarations: [ChangeTaskViewComponent, MenuButtonComponent,  AvatarSize, PriorityComponent, TruncatePipe,
        Minutes2hoursPipe, DateToString, RepeatString, RepeatStringExtension],
    exports: [ChangeTaskViewComponent, MenuButtonComponent,  AvatarSize, PriorityComponent, TruncatePipe,
        Minutes2hoursPipe, DateToString, RepeatString, RepeatStringExtension]
})
export class TickistSharedModule {
}
