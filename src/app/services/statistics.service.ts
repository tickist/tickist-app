import {Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {Headers, RequestOptions, Response} from '@angular/http';
import {Store} from '@ngrx/store';
import {environment} from '../../environments/environment';
import {AppStore} from '../store';

import {GlobalStatistics, DailyStatistics, ChartStatistics} from '../models/statistics';
import {ConfigurationService} from './configuration.service';
import * as statisticsAction from '../reducers/actions/statistics';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {IActiveDateElement} from '../models/active-data-element.interface';

@Injectable()
export class StatisticsService {
    global$: Observable<GlobalStatistics>;
    charts$: Observable<ChartStatistics>;
    daily$: Observable<DailyStatistics>;
    globalStatisticsDateRage$: Observable<any>;
    activeDateElement: IActiveDateElement;

    constructor(public http: HttpClient, private store: Store<AppStore>, private configurationService: ConfigurationService) {
        this.global$ = this.store.select(store => store.globalStatistics);
        this.charts$ = this.store.select(store => store.chartsData);
        this.globalStatisticsDateRage$ = this.store.select(store => store.globalStatisticsDateRage);
        this.daily$ = this.store.select(store => store.dailyStatistics);
        configurationService.activeDateElement$.subscribe((activeDateElement: IActiveDateElement) => {
            this.loadDailyStatistics(activeDateElement);
            this.activeDateElement = activeDateElement;
        });
        this.globalStatisticsDateRage$.subscribe((dateRange) => {
            this.loadGlobalStatistics();
            this.loadChartsData();
        });
    }

    loadAllStatistics(date) {
        this.loadDailyStatistics(date);
        this.loadGlobalStatistics();
        this.loadChartsData();
    }

    loadDailyStatistics(activeDateElement: IActiveDateElement) {
        const formatedDate = activeDateElement ? activeDateElement.date.format('YYYY-MM-DD') : this.activeDateElement.date.format('YYYY-MM-DD');
        this.http.get(`${environment['apiUrl']}/day_statistics/?date=${formatedDate}`)
            .pipe(map(payload => new DailyStatistics(payload)))
            .subscribe(payload => this.store.dispatch((new statisticsAction.UpdateDailyStatistics(payload))));
    }

    loadGlobalStatistics() {
        this.http.get(`${environment['apiUrl']}/global/`)
            .pipe(map(payload => new GlobalStatistics(payload)))
            .subscribe(payload => this.store.dispatch(new statisticsAction.UpdateGlobalStatistics(payload)));
    }

    loadChartsData() {
        this.http.get(`${environment['apiUrl']}/charts/`)
            .pipe(map(payload => new ChartStatistics(payload)))
            .subscribe(payload => this.store.dispatch(new statisticsAction.UpdateChartsData(payload)));
    }
}
