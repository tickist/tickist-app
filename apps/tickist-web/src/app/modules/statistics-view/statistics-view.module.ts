import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TickistMaterialModule} from '../../material.module';
import {FormsModule} from '@angular/forms';
import {DayStatisticsComponent} from './components/day-statistics/day-statistics.component';
import {ChartsModule} from 'ng2-charts';
import {ChartLegendComponent} from './components/day-statistics/chart-legend/chart-legend.component';
import {GlobalStatisticsComponent} from './components/global-statistics/global-statistics.component';
import {TickistSharedModule} from '../../shared/shared.module';
import { StoreModule } from '@ngrx/store';
import * as fromGlobalStatistics from './reducers/global-statistics.reducer';
import * as fromDailyStatistics from './reducers/daily-statistics.reducer';
import * as fromChartStatistics from './reducers/chart-data.reducer';
import * as fromGlobalStatisticsDateRange from './reducers/global-statistics-date-range.reducer';
import {EffectsModule} from '@ngrx/effects';
import {StatisticsEffects} from './effects/statistics.effects';
import { StatisticsComponent } from './pages/statistics/statistics.component';
import {TickistStatisticsRoutingModule} from './statistics-routing.module';



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
        StoreModule.forFeature('globalStatisticsDateRange', fromGlobalStatisticsDateRange.reducer),
        TickistStatisticsRoutingModule
    ],
    providers: [],
    exports:
        [],
    declarations:
        [DayStatisticsComponent, ChartLegendComponent, GlobalStatisticsComponent, StatisticsComponent]
})

export class TickistStatisticsViewModule {
}
