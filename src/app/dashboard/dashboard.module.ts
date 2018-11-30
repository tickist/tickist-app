import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TickistMaterialModule} from '../material.module';
import {DashboardComponent} from './dashboard.component';
import {ChooseDayComponent} from './choose-day/choose-day.component';
import {FilterFutureTasksComponent} from './filter-future-tasks/filter-future-tasks.component';
import {FutureTasksComponent} from './future-tasks/future-tasks.component';
import {FutureListComponent} from './future-list/future-list.component';
import {TodayComponent} from './today/today.component';
import {OverdueComponent} from './overdue/overdue.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TickistSharedModule} from '../shared/shared.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {DaysWeeksYearListComponent} from './days-weeks-year-list/days-weeks-year-list.component';
import {TickistSingleTaskModule} from '../single-task/single-task.module';
import {WeekDaysComponent} from './weekdays/weekdays.component';
import {TickistStatisticsModule} from '../statistics/statistics.module';

@NgModule({
    imports: [ CommonModule, TickistMaterialModule, FormsModule, FlexLayoutModule,
        ReactiveFormsModule, TickistSharedModule, TickistSingleTaskModule, TickistStatisticsModule],
    providers: [
    ],
    exports: [DashboardComponent, FutureTasksComponent],
    declarations: [DashboardComponent, ChooseDayComponent, FilterFutureTasksComponent, FutureTasksComponent,
        FutureListComponent, TodayComponent, OverdueComponent, DaysWeeksYearListComponent, WeekDaysComponent]
})
export class TickistDashboardModule {
}
