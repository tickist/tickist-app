import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Minutes2hoursPipe } from "../../../../shared/pipes/minutes2hours";
import { Store } from "@ngrx/store";
import { selectChartStatistics, selectGlobalStatistics } from "../../statistics.selectors";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ChartStatistics, GlobalStatistics } from "@data/statistics";
import { format } from "date-fns";

@Component({
    selector: "tickist-global-statistics",
    templateUrl: "./global-statistics.component.html",
    styleUrls: ["./global-statistics.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalStatisticsComponent implements OnInit, OnDestroy {
    global$: Observable<GlobalStatistics>;
    charts$: Observable<ChartStatistics>;
    global: GlobalStatistics;
    charts: ChartStatistics;
    dataTasksCounter: any;
    dataTimeChart: any;
    minutes2Hours: Minutes2hoursPipe;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    constructor(private store: Store, private cd: ChangeDetectorRef) {
        this.minutes2Hours = new Minutes2hoursPipe();
    }

    public chartClicked(e: any): void {
        console.log(e);
    }

    public chartHovered(e: any): void {
        console.log(e);
    }

    ngOnInit() {
        this.global$ = this.store.select(selectGlobalStatistics);
        this.global$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((global) => {
            if (global) {
                this.global = global;
                this.cd.detectChanges();
            }
        });
        this.charts$ = this.store.select(selectChartStatistics);
        this.charts$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((charts) => {
            const tasksCounterX: string[] = [],
                tasksCounterY = [],
                timeChartX: string[] = [],
                estimateTimeChartY = [],
                timeChartY = [];

            this.charts = charts;
            if (this.charts) {
                this.charts.tasksChart.forEach((elem) => {
                    tasksCounterX.push(format(new Date(elem.x), "ddd"));
                    tasksCounterY.push(elem.tasksCounter);
                });
                this.charts.timeChart.forEach((elem) => {
                    timeChartX.push(format(new Date(elem.x), "ddd"));
                    timeChartY.push(elem.time);
                    estimateTimeChartY.push(elem.estimateTime);
                });
                this.dataTimeChart = {
                    labels: timeChartX,
                    datasets: [
                        {
                            label: "Estimated time",
                            data: estimateTimeChartY,
                        },
                        {
                            label: "Real time",
                            data: timeChartY,
                        },
                    ],
                    chartType: "line",
                    legend: true,
                    options: {
                        scaleShowVerticalLines: false,
                        responsive: true,
                        scales: {
                            yAxes: [
                                {
                                    ticks: {
                                        beginAtZero: true,
                                        callback: (value) => {
                                            if (value % 1 === 0) {
                                                return this.minutes2Hours.transform(value);
                                            }
                                        },
                                        fontColor: "white",
                                    },
                                },
                            ],
                            xAxes: [
                                {
                                    ticks: {
                                        fontColor: "white",
                                        fontSize: 10,
                                    },
                                },
                            ],
                        },
                        legend: {
                            position: "bottom",
                            labels: {
                                fontColor: "#fff",
                            },
                        },
                    },
                };
                this.dataTasksCounter = {
                    labels: tasksCounterX,
                    datasets: [
                        {
                            label: "Task counter",
                            data: tasksCounterY,
                        },
                    ],
                    chartType: "line",
                    legend: true,
                    options: {
                        scaleShowVerticalLines: false,
                        responsive: true,
                        scales: {
                            yAxes: [
                                {
                                    ticks: {
                                        beginAtZero: true,
                                        callback: function (value) {
                                            if (value % 1 === 0) {
                                                return value;
                                            }
                                        },
                                        fontColor: "white",
                                    },
                                },
                            ],
                            xAxes: [
                                {
                                    ticks: {
                                        fontColor: "white",
                                        fontSize: 10,
                                    },
                                },
                            ],
                        },
                        legend: {
                            position: "bottom",
                            labels: {
                                fontColor: "#fff",
                            },
                        },
                    },
                };
                // if (this.tasksCounterChart) {
                //     this.tasksCounterChart.chart.update();
                // }
                // if (this.timeChart) {
                //     this.timeChart.chart.update();
                // }
                this.cd.detectChanges();
            }
        });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
