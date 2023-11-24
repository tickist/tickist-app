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
