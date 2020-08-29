import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TickistMaterialModule} from '../../material.module';
import {WeekdaysComponent} from './pages/weekdays/weekdays.component';
import {TodayComponent} from './components/today/today.component';
import {OverdueComponent} from './components/overdue/overdue.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TickistSharedModule} from '../../shared/shared.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TickistTasksModule} from '../../tasks/tasks.module';
import {TickistWeekdaysRoutingModule} from './weekdays-routing.module';
import {TickistSingleTaskModule} from '../../single-task/single-task.module';


@NgModule({
    imports: [CommonModule, TickistMaterialModule, FormsModule, FlexLayoutModule, TickistWeekdaysRoutingModule,
        ReactiveFormsModule, TickistSharedModule, TickistSingleTaskModule, TickistTasksModule],
    providers: [],
    exports: [WeekdaysComponent],
    declarations: [
        WeekdaysComponent,
        TodayComponent,
        OverdueComponent,
    ]
})
export class TickistWeekdaysModule {
}
