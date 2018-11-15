import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChangeTaskViewComponent} from './change-task-view-component/change-task-view.component';
import {TickistMaterialModule} from '../material.module';
import {FormsModule} from '@angular/forms';
import {ConfigurationService} from '../services/configurationService';
import {MenuButtonComponent} from './menu-button/menu-button.component';
import {AvatarSize} from './pipes/avatarSize';
import {PriorityComponent} from './priority/priority.component';
import {TruncatePipe} from './pipes/truncate.pipe';
import {Minutes2hoursPipe} from './pipes/minutes2hours';
import {DateToString} from './pipes/datetostring';


@NgModule({
    imports: [ CommonModule, TickistMaterialModule, FormsModule],
    providers: [
        ConfigurationService
    ],
    exports: [ChangeTaskViewComponent, MenuButtonComponent,  AvatarSize, PriorityComponent, TruncatePipe,
        Minutes2hoursPipe, DateToString,],
    declarations: [ChangeTaskViewComponent, MenuButtonComponent,  AvatarSize, PriorityComponent, TruncatePipe,
        Minutes2hoursPipe, DateToString,]
})
export class TickistSharedModule {
}
