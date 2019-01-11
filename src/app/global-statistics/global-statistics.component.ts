import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {StatisticsService} from '../services/statistics.service';
import {ChartStatistics} from '../models/statistics';
import * as moment from 'moment';
import {BaseChartDirective} from 'ng2-charts';
import {Minutes2hoursPipe} from '../shared/pipes/minutes2hours';


@Component({
    selector: 'tickist-global-statistics',
    templateUrl: './global-statistics.component.html',
    styleUrls: ['./global-statistics.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GlobalStatisticsComponent implements OnInit {
    global: any;
    charts: ChartStatistics;
    dataTasksCounter: any;
    dataTimeChart: any;
    optionsTasksCounter: any = {};
    optionsTimeChart: any = {};
    minutes2Hours: Minutes2hoursPipe;
    @ViewChild('tasksCounterChart', {read: BaseChartDirective}) tasksCounterChart: any;
    @ViewChild('timeChart', {read: BaseChartDirective}) timeChart: any;

    constructor(private statisticsService: StatisticsService, private cd: ChangeDetectorRef) {
        this.minutes2Hours = new Minutes2hoursPipe();
    }

    public chartClicked(e: any): void {
        console.log(e);
    }

    public chartHovered(e: any): void {
        console.log(e);
    }


    ngOnInit() {
        this.statisticsService.global$.subscribe((global) => {
            if (global) {
                this.global = global;
            }
        });
        this.statisticsService.charts$.subscribe((charts) => {
            const tasksCounterX: string[] = [], tasksCounterY = [], timeChartX: string[] = [], estimateTimeChartY = [],
                timeChartY = [];

            this.charts = charts;
            if (this.charts) {
                this.charts.tasksChart.forEach((elem) => {
                    tasksCounterX.push(moment(elem.x).format('ddd'));
                    tasksCounterY.push(elem.tasksCounter);
                });
                this.charts.timeChart.forEach((elem) => {
                    timeChartX.push(moment(elem.x).format('ddd'));
                    timeChartY.push(elem.time);
                    estimateTimeChartY.push(elem.estimateTime);
                });
                this.dataTimeChart = {
                    labels: timeChartX,
                    datasets: [
                        {
                            label: 'Estimated time',
                            data: estimateTimeChartY
                        },
                        {
                            label: 'Real time',
                            data: timeChartY
                        }
                    ],
                    chartType: 'line',
                    legend: true,
                    options: {
                        scaleShowVerticalLines: false,
                        responsive: true,
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true,
                                    callback: (value) => {
                                        if (value % 1 === 0) {
                                            return this.minutes2Hours.transform(value);
                                        }
                                    },
                                    fontColor: 'white'
                                }
                            }],
                            xAxes: [{
                                ticks: {
                                    fontColor: 'white',
                                    fontSize: 10,
                                }
                            }]
                        },
                        legend: {
                            position: 'bottom',
                            labels: {
                                fontColor: '#fff'
                            }
                        }
                    }
                };
                this.dataTasksCounter = {
                    labels: tasksCounterX,
                    datasets: [
                        {
                            label: 'Task counter',
                            data: tasksCounterY
                        }
                    ],
                    chartType: 'line',
                    legend: true,
                    options: {
                        scaleShowVerticalLines: false,
                        responsive: true,
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true,
                                    callback: function (value) {
                                        if (value % 1 === 0) {
                                            return value;
                                        }
                                    },
                                    fontColor: 'white'
                                }
                            }],
                            xAxes: [{
                                ticks: {
                                    fontColor: 'white',
                                    fontSize: 10,
                                }
                            }]
                        },
                        legend: {
                            position: 'bottom',
                            labels: {
                                fontColor: '#fff'
                            }
                        }
                    }
                };
                if (this.tasksCounterChart) {
                    this.tasksCounterChart.chart.update();
                }
                if (this.timeChart) {
                    this.timeChart.chart.update();
                }
                this.cd.detectChanges();

            }
        });
    }

}
