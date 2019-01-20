import {Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {Headers, RequestOptions, Response} from '@angular/http';
import {select, Store} from '@ngrx/store';
import {environment} from '../../environments/environment';
import {AppStore} from '../store';

import {GlobalStatistics, DailyStatistics, ChartStatistics} from '../models/statistics';
import {ConfigurationService} from './configuration.service';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {IActiveDateElement} from '../models/active-data-element.interface';
import * as  moment from 'moment';

@Injectable()
export class StatisticsService {
    global$: Observable<GlobalStatistics>;
    charts$: Observable<ChartStatistics>;
    daily$: Observable<DailyStatistics>;
    globalStatisticsDateRage$: Observable<any>;
    activeDateElement: IActiveDateElement;

    constructor(public http: HttpClient, private store: Store<AppStore>, private configurationService: ConfigurationService) {
        configurationService.activeDateElement$.subscribe((activeDateElement: IActiveDateElement) => {
            this.loadDailyStatistics(activeDateElement.date);
            this.activeDateElement = activeDateElement;
        });
        // this.globalStatisticsDateRage$.subscribe((dateRange) => {
        //     this.loadGlobalStatistics();
        //     this.loadChartsData();
        // });
    }

    // loadAllStatistics(date) {
    //     this.loadDailyStatistics(date);
    //     this.loadGlobalStatistics();
    //     this.loadChartsData();
    // }

    loadDailyStatistics(date: moment.Moment = moment()): Observable<DailyStatistics> {
        // const formatedDate = activeDateElement ?
        //     activeDateElement.date.format('YYYY-MM-DD') :
        //     this.activeDateElement.date.format('YYYY-MM-DD');
        const formatedDate = date.format('YYYY-MM-DD');
        return this.http.get(`${environment['apiUrl']}/day_statistics/?date=${formatedDate}`)
            .pipe(
                map(payload => new DailyStatistics(payload))
            );
            // .subscribe(payload => this.store.dispatch((new statisticsAction.UpdateDailyStatistics(payload))));
    }

    loadGlobalStatistics(): Observable<GlobalStatistics> {
        return this.http.get(`${environment['apiUrl']}/global/`)
            .pipe(
                map(payload => new GlobalStatistics(payload))
            );
            // .subscribe(payload => this.store.dispatch(new statisticsAction.UpdateGlobalStatistics(payload)));
    }

    loadChartsData(): Observable<ChartStatistics> {
        return this.http.get(`${environment['apiUrl']}/charts/`)
            .pipe(
                map(payload => new ChartStatistics(payload))
            );
            // .subscribe(payload => this.store.dispatch(new statisticsAction.UpdateChartsData(payload)));
    }
}
