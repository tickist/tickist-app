import {Component, Input, OnInit} from '@angular/core';

@Component({
    selector: 'tickist-chart-legend',
    templateUrl: './chart-legend.component.html',
    styleUrls: ['./chart-legend.component.scss']
})
export class ChartLegendComponent implements OnInit {
    @Input() data;
    isLegendVisible = false;

    constructor() {
    }

    ngOnInit() {
    }

    changeLegendVisibility() {
        this.isLegendVisible = !this.isLegendVisible;
    }
}
