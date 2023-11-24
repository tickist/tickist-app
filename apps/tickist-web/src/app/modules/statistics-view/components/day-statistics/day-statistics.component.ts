import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { ConfigurationService } from "../../../../core/services/configuration.service";
import { Observable, Subject, Subscription } from "rxjs";
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as _ from "lodash";
import { Chart } from "../../models";
import { Store } from "@ngrx/store";
import { selectDailyStatistics } from "../../statistics.selectors";
import { takeUntil } from "rxjs/operators";
import { selectActiveDate } from "../../../../core/selectors/active-date.selectors";
import { IActiveDateElement } from "@data/active-data-element.interface";
import { DailyStatistics } from "@data/statistics";

@Component({
    selector: "tickist-day-statistics",
    templateUrl: "./day-statistics.component.html",
    styleUrls: ["./day-statistics.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayStatisticsComponent implements OnInit, OnDestroy {
    dayStatistics: any;
    dailyStatistics$: Observable<DailyStatistics>;
    activeDateElement: IActiveDateElement;
    data: any;
    prioritiesTasksCounter: any;
    options: any;
    charts: Chart[];
    activeChart: Chart;
    numberOfCharts: number;
    nextChart: any;
    previousChart: any;
    chartInterval: any;
    subscriptions: Subscription;
    protected interval = 10000;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    constructor(
        private store: Store,
        private configurationService: ConfigurationService,
        private cd: ChangeDetectorRef,
        private ngZone: NgZone
    ) {}

    ngOnInit() {
        this.dailyStatistics$ = this.store.select(selectDailyStatistics);
        this.dailyStatistics$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((daily) => {
            if (daily) {
                this.dayStatistics = daily;
                this.charts = [
                    new Chart({
                        id: 1,
                        name: "prioritiesTasksCounter",
                        data: this.generatePrioritiesTasksCounterChartData(),
                        legend: this.generateLegendPrioritiesTasksCounterChartData(),
                    }),
                    new Chart({
                        id: 2,
                        name: "projectsTasksCounter",
                        data: this.generateProjectsTasksCounterChartData(),
                        legend: this.generateLegendProjectsTasksCounterChartData(),
                    }),
                    new Chart({
                        id: 3,
                        name: "tagsTasksCounter",
                        data: this.generateTagsTasksCounterChartData(),
                        legend: this.generateLegendTagsTasksCounterChartData(),
                    }),
                ];
                this.activeChart = this.charts[0];
                this.numberOfCharts = this.charts.length;
                this.cd.detectChanges();
            }
        });
        this.store
            .select(selectActiveDate)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((activeDateElement) => {
                this.activeDateElement = activeDateElement;
                // this.statisticsService.loadDailyStatistics(this.activeDay);
            });

        this.nextChart = () => {
            if (this.activeChart) {
                let newActiveChartId = this.activeChart.id + 1;
                if (newActiveChartId > this.numberOfCharts) {
                    newActiveChartId = 1;
                }
                if (this.charts && this.charts.length > 0) {
                    this.activeChart = this.charts.filter((chart) => chart.id === newActiveChartId)[0];
                }
            }
        };

        this.previousChart = () => {
            let newActiveChartId = this.activeChart.id - 1;
            if (newActiveChartId === 0) {
                newActiveChartId = this.numberOfCharts;
            }
            this.activeChart = this.charts.filter((chart) => chart.id === newActiveChartId)[0];
        };
        this.ngZone.runOutsideAngular(() => {
            this.chartInterval = setInterval(() => {
                this.ngZone.run(() => {
                    this.nextChart();
                });
            }, this.interval);
        });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        clearInterval(this.chartInterval);
    }

    generatePrioritiesTasksCounterChartData() {
        const labels = [],
            data = [],
            colors = [];
        this.dayStatistics.priorities.forEach((priority) => {
            labels.push(priority.name);
            data.push(priority.count);
            colors.push(priority.color);
        });
        return {
            labels: labels,
            datasets: [
                {
                    data: data,
                    labels: labels,
                    borderColor: "grey",
                },
            ],
            chartType: "pie",
            legend: false,
            colors: [{ backgroundColor: colors }],
            options: {
                title: {
                    display: true,
                    text: "Priorities tasks counter",
                    fontSize: 16,
                    fontColor: "white",
                },
                tooltips: {
                    custom: function (tooltip) {
                        // tooltip will be false if tooltip is not visible or should be hidden
                        if (!tooltip) {
                            return;
                        }
                    },
                    callbacks: {
                        label: function (tooltipItem, chartData) {
                            const index = tooltipItem.index,
                                label = chartData.datasets[0].labels[index],
                                tasksCounter = chartData.datasets[0].data[index];
                            return `Priority ${label} (${tasksCounter} tasks)`;
                        },
                    },
                },
            },
        };
    }

    generateLegendPrioritiesTasksCounterChartData() {
        const legend = [];
        this.dayStatistics.priorities.forEach((priority) => {
            legend.push({ name: priority.name, color: priority.color });
        });
        return legend;
    }

    generateProjectsTasksCounterChartData() {
        const labels = [],
            data = [],
            colors = [];
        this.dayStatistics.lists.forEach((project) => {
            labels.push(project.name);
            data.push(project.count);
            colors.push(project.color);
        });
        return {
            datasets: [
                {
                    data: data,
                    labels: labels,
                    borderColor: "grey",
                },
            ],
            chartType: "pie",
            colors: [{ backgroundColor: colors }],
            legend: true,
            options: {
                title: {
                    display: true,
                    text: "Projects tasks counter",
                    fontSize: 16,
                    fontColor: "white",
                },
                tooltips: {
                    custom: function (tooltip) {
                        // tooltip will be false if tooltip is not visible or should be hidden
                        if (!tooltip) {
                            return;
                        }
                    },
                    callbacks: {
                        label: function (tooltipItem, chartData) {
                            const index = tooltipItem.index,
                                label = chartData.datasets[0].labels[index],
                                tasksCounter = chartData.datasets[0].data[index];
                            return `${label} (${tasksCounter} tasks)`;
                        },
                    },
                },
                hover: {
                    onHover: function () {},
                },
            },
        };
    }

    generateLegendProjectsTasksCounterChartData() {
        const legend = [];
        this.dayStatistics.lists.forEach((project) => {
            legend.push({ name: project.name, color: project.color });
        });
        return legend;
    }

    generateTagsTasksCounterChartData() {
        const labels = [],
            data = [],
            colors = [];
        this.dayStatistics.tags.forEach((tag) => {
            labels.push(tag.name);
            data.push(tag.count);
            colors.push(tag.color);
        });
        return {
            datasets: [
                {
                    data: data,
                    labels: labels,
                    borderColor: "grey",
                },
            ],
            chartType: "pie",
            colors: [{ backgroundColor: colors }],
            legend: true,
            options: {
                title: {
                    display: true,
                    text: "Tags tasks counter",
                    fontSize: 16,
                    fontColor: "white",
                },
                tooltips: {
                    custom: function (tooltip) {
                        // tooltip will be false if tooltip is not visible or should be hidden
                        if (!tooltip) {
                            return;
                        }
                    },
                    callbacks: {
                        label: function (tooltipItem, chartData) {
                            const index = tooltipItem.index,
                                label = chartData.datasets[0].labels[index],
                                tasksCounter = chartData.datasets[0].data[index];
                            return `${label} (${tasksCounter} tasks)`;
                        },
                    },
                },
                hover: {
                    onHover: function () {},
                },
            },
        };
    }

    generateLegendTagsTasksCounterChartData() {
        const legend = [];
        this.dayStatistics.tags.forEach((tag) => {
            legend.push({ name: tag.name, color: tag.color });
        });
        return legend;
    }

    isChartActive(chartId) {
        return chartId === this.activeChart.id;
    }

    changeActiveChart(chartId) {
        this.activeChart = this.charts.filter((chart) => chart.id === chartId)[0];
    }

    isChartEmpty(chart: Chart) {
        const chartData = _.get(chart, "data.datasets.0.data");
        return (<Array<any>>chartData).length === 0;
    }
}
