import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {StatisticsService} from "../services/statisticsService";
import {ConfigurationService} from "../services/configurationService";
import * as moment from 'moment';
import {Subscription} from "rxjs";

class Chart {
  id: number;
  name: string;
  data: any;


  constructor(chart) {
    this.id = chart.id;
    this.name = chart.name;
    this.data = chart.data;
  }
}

@Component({
  selector: 'app-day-statistics',
  templateUrl: './day-statistics.component.html',
  styleUrls: ['./day-statistics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DayStatisticsComponent implements OnInit, OnDestroy {
  dayStatistics: any;
  activeDay: moment.Moment;
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

  constructor(private statisticsService: StatisticsService, private configurationService: ConfigurationService) {
    console.log("DAY STATISTICS")
  }

  ngOnInit() {
    this.subscriptions = this.statisticsService.daily$.subscribe((daily) => {
      if (daily) {
        this.dayStatistics = daily;
        this.charts = [
          new Chart({
            'id': 1,
            'name': 'prioritiesTasksCounter',
            'data': this.generatePrioritiesTasksCounterChartData()
          }),
          new Chart({'id': 2, 'name': 'projectsTasksCounter', 'data': this.generateProjectsTasksCounterChartData()}),
          new Chart({'id': 3, 'name': 'tagsTasksCounter', 'data': this.generateTagsTasksCounterChartData()}),
        ];
        this.activeChart = this.charts[0];
        this.numberOfCharts = this.charts.length;

      }
    });
    this.subscriptions.add(this.configurationService.activeDay$.subscribe((activeDay) => {
      this.activeDay = activeDay;
    }));

    this.nextChart = (() => {
      if (this.activeChart) {
        let newActiveChartId = this.activeChart.id + 1;
        if (newActiveChartId > this.numberOfCharts) {
          newActiveChartId = 1;
        }
        if (this.charts && this.charts.length > 0) {
          this.activeChart = this.charts.filter((chart) => chart.id === newActiveChartId)[0];
        }
      }

    });

    this.previousChart = (() => {
      let newActiveChartId = this.activeChart.id - 1;
      if (newActiveChartId === 0) {
        newActiveChartId = this.numberOfCharts;
      }
      this.activeChart = this.charts.filter((chart) => chart.id === newActiveChartId)[0];

    });
    this.chartInterval = setInterval(this.nextChart, this.interval);
  }

  ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
    clearInterval(this.chartInterval);
  }

  generatePrioritiesTasksCounterChartData() {
    const labels = [], data = [];
    this.dayStatistics.priorities.forEach((priority) => {
      labels.push(priority.name);
      data.push(priority.count);
    });
    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56"
          ],
          hoverBackgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56"
          ]
        }],
      chartType: 'pie',
      legend: true,
      options: {
        title: {
          display: true,
          text: 'Priorities tasks counter',
          fontSize: 16,
          fontColor: 'white'
        },
        legend: {
          position: 'bottom',
          labels: {
            fontColor: '#fff'
          },
          onHover: function (event, legendItem) {
            debugger;
          }
        },
        tooltips: {
          custom: function (tooltip) {
            // tooltip will be false if tooltip is not visible or should be hidden
            console.log(tooltip)
            if (!tooltip) {
              return;
            }

            // Otherwise, tooltip will be an object with all tooltip properties like:

            // tooltip.caretSize
            // tooltip.caretPadding
            // tooltip.chart
            // tooltip.cornerRadius
            // tooltip.fillColor
            // tooltip.font...
            // tooltip.text
            // tooltip.x
            // tooltip.y
            // tooltip.caretX
            // tooltip.caretY
            // etc...
          },
          callbacks: {
            'label': function (tooltipItem, data) {
              let index = tooltipItem.index,
                label = data.labels[index],
                tasksCounter = data.datasets[0].data[index];
              return `Priority ${label} (${tasksCounter} tasks)`;

            }
          }
        },
        hover: {
          onHover: function () {
            //debugger;
          }
        }

      }
    };
  }


  generateProjectsTasksCounterChartData() {
    const labels = [], data = [];
    this.dayStatistics.lists.forEach((project) => {
      labels.push(project.name);
      data.push(project.count);
    });
    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56"
          ],
          hoverBackgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56"
          ]
        }],
      chartType: 'pie',
      legend: true,
      options: {
        title: {
          display: true,
          text: 'Projects tasks counter',
          fontSize: 16,
          fontColor: 'white'
        },
        legend: {
          position: 'bottom',
          labels: {
            fontColor: '#fff'
          },
          onHover: function (event, legendItem) {
            debugger;
          }
        },
        tooltips: {
          custom: function (tooltip) {
            // tooltip will be false if tooltip is not visible or should be hidden
            console.log(tooltip)
            if (!tooltip) {
              return;
            }

            // Otherwise, tooltip will be an object with all tooltip properties like:

            // tooltip.caretSize
            // tooltip.caretPadding
            // tooltip.chart
            // tooltip.cornerRadius
            // tooltip.fillColor
            // tooltip.font...
            // tooltip.text
            // tooltip.x
            // tooltip.y
            // tooltip.caretX
            // tooltip.caretY
            // etc...
          },
          callbacks: {
            'label': function (tooltipItem, data) {
              let index = tooltipItem.index,
                label = data.labels[index],
                tasksCounter = data.datasets[0].data[index];
              return `${label} (${tasksCounter} tasks)`;
            }
          }
        },
        hover: {
          onHover: function () {
            //debugger;
          }
        }

      }
    };
  }


  generateTagsTasksCounterChartData() {
    const labels = [], data = [];
    this.dayStatistics.tags.forEach((tag) => {
      labels.push(tag.name);
      data.push(tag.count);
    });
    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56"
          ],
          hoverBackgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56"
          ]
        }],
      chartType: 'pie',
      legend: true,
      options: {
        title: {
          display: true,
          text: 'Tags tasks counter',
          fontSize: 16,
          fontColor: 'white'
        },
        legend: {
          position: 'bottom',
          onHover: function (event, legendItem) {
            debugger;
          },
          labels: {
            fontColor: '#fff'
          }
        },
        tooltips: {
          custom: function (tooltip) {
            // tooltip will be false if tooltip is not visible or should be hidden
            console.log(tooltip)
            if (!tooltip) {
              return;
            }

            // Otherwise, tooltip will be an object with all tooltip properties like:

            // tooltip.caretSize
            // tooltip.caretPadding
            // tooltip.chart
            // tooltip.cornerRadius
            // tooltip.fillColor
            // tooltip.font...
            // tooltip.text
            // tooltip.x
            // tooltip.y
            // tooltip.caretX
            // tooltip.caretY
            // etc...
          },
          callbacks: {
            'label': function (tooltipItem, data) {
              let index = tooltipItem.index,
                label = data.labels[index],
                tasksCounter = data.datasets[0].data[index];
              return `${label} (${tasksCounter} tasks)`;

            }
          }
        },
        hover: {
          onHover: function () {
            //debugger;
          }
        }

      }
    };
  }


  isChartActive(chartId) {
    return chartId === this.activeChart.id;
  }

  changeActiveChart(chartId) {
    this.activeChart = this.charts.filter((chart) => chart.id === chartId)[0];

  }

}
