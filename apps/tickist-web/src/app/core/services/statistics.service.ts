import { of } from "rxjs";
import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { selectActiveDate } from "../selectors/active-date.selectors";
import { IActiveDateElement } from "@data/active-data-element.interface";

@Injectable({
    providedIn: "root",
})
export class StatisticsService {
    activeDateElement: IActiveDateElement;

    constructor(private store: Store) {
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

    loadDailyStatistics(): any {
        // const formatedDate = activeDateElement ?
        //     activeDateElement.date.format('YYYY-MM-DD') :
        //     this.activeDateElement.date.format('YYYY-MM-DD');

        return of({});
        // this.http.get(`${environment['apiUrl']}/day_statistics/?date=${formatedDate}`)
        //     .pipe(
        //         map(payload => new DailyStatistics(payload))
        //     );
        // .subscribe(payload => this.store.dispatch((new statisticsAction.UpdateDailyStatistics(payload))));
    }

    loadGlobalStatistics(): any {
        return of({});

        // return this.http.get(`${environment['apiUrl']}/global/`)
        //     .pipe(
        //         map(payload => new GlobalStatistics(payload))
        //     );
        //     // .subscribe(payload => this.store.dispatch(new statisticsAction.UpdateGlobalStatistics(payload)));
    }

    loadChartsData(): any {
        return of({});

        // return this.http.get(`${environment['apiUrl']}/charts/`)
        //     .pipe(
        //         map(payload => new ChartStatistics(payload))
        //     );
        //     // .subscribe(payload => this.store.dispatch(new statisticsAction.UpdateChartsData(payload)));
    }
}
