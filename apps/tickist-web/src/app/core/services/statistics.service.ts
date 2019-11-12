import {Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {environment} from '../../../environments/environment';
import {AppStore} from '../../store';

import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {selectActiveDate} from '../selectors/active-date.selectors';
import {IActiveDateElement} from '@data/active-data-element.interface';
import {ChartStatistics, DailyStatistics, GlobalStatistics} from '@data/statistics';
import {format} from 'date-fns';

@Injectable()
export class StatisticsService {
    activeDateElement: IActiveDateElement;

    constructor(public http: HttpClient, private store: Store<AppStore>) {
        this.store.select(selectActiveDate).subscribe((activeDateElement: IActiveDateElement) => {
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

    loadDailyStatistics(date: Date = new Date()): Observable<DailyStatistics> {
        // const formatedDate = activeDateElement ?
        //     activeDateElement.date.format('YYYY-MM-DD') :
        //     this.activeDateElement.date.format('YYYY-MM-DD');
        const formatedDate = format(date, 'yyyy-MM-dd');
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
