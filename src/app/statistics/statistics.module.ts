import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TickistMaterialModule} from '../material.module';
import {FormsModule} from '@angular/forms';
import {DayStatisticsComponent} from './day-statistics/day-statistics.component';
import {ChartsModule} from 'ng2-charts';
import {ChartLegendComponent} from './day-statistics/chart-legend/chart-legend.component';
import {GlobalStatisticsComponent} from './global-statistics/global-statistics.component';
import {TickistSharedModule} from '../shared/shared.module';
import { StoreModule } from '@ngrx/store';
import * as fromGlobalStatistics from './global-statistics.reducer';
import * as fromDailyStatistics from './daily-statistics.reducer';
import * as fromChartStatistics from './chart-data.reducer';
import * as fromGlobalStatisticsDateRange from './global-statistics-date-range.reducer';
import {EffectsModule} from '@ngrx/effects';
import {StatisticsEffects} from './statistics.effects';



@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FormsModule,
        ChartsModule,
        TickistSharedModule,
        EffectsModule.forFeature([StatisticsEffects]),
        StoreModule.forFeature('globalStatistics', fromGlobalStatistics.reducer),
        StoreModule.forFeature('dailyStatistics', fromDailyStatistics.reducer),
        StoreModule.forFeature('chartStatistics', fromChartStatistics.reducer),
        StoreModule.forFeature('globalStatisticsDateRange', fromGlobalStatisticsDateRange.reducer)
    ],
    providers: [],
    exports:
        [DayStatisticsComponent, GlobalStatisticsComponent],
    declarations:
        [DayStatisticsComponent, ChartLegendComponent, GlobalStatisticsComponent]
})

export class TickistStatisticsModule {
}
