import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TickistMaterialModule} from '../material.module';
import {FormsModule} from '@angular/forms';
import {DayStatisticsComponent} from './day-statistics/day-statistics.component';
import {ChartsModule} from 'ng2-charts';
import {ChartLegendComponent} from './day-statistics/chart-legend/chart-legend.component';
import {GlobalStatisticsComponent} from './global-statistics/global-statistics.component';
import {TickistSharedModule} from '../shared/shared.module';


@NgModule({
    imports: [ CommonModule, TickistMaterialModule, FormsModule,  ChartsModule, TickistSharedModule],
    providers: [
    ],
    exports: [DayStatisticsComponent, GlobalStatisticsComponent],
    declarations: [DayStatisticsComponent,  ChartLegendComponent, GlobalStatisticsComponent]
})
export class TickistStatisticsModule {
}
