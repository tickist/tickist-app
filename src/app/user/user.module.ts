import {NgModule} from '@angular/core';
import {UserComponent} from './user/user.component';
import {TeamComponent} from './team/team.component';
import {TickistMaterialModule} from '../material.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {CalendarModule} from 'primeng/components/calendar/calendar';
import {TickistSharedModule} from '../shared/shared.module';


@NgModule({
    imports: [
        CommonModule, TickistMaterialModule, FlexLayoutModule, ReactiveFormsModule, TickistSharedModule, FormsModule, CalendarModule
    ],
    providers: [
    ],
    exports: [
    ],
    declarations: [
        UserComponent, TeamComponent
    ]
})
export class TickistUserModule {
}
