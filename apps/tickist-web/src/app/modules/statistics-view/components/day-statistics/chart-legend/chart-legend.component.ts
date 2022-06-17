import { Component, Input } from "@angular/core";

@Component({
    selector: "tickist-chart-legend",
    templateUrl: "./chart-legend.component.html",
    styleUrls: ["./chart-legend.component.scss"],
})
export class ChartLegendComponent {
    @Input() data;
    isLegendVisible = false;

    constructor() {}

    changeLegendVisibility() {
        this.isLegendVisible = !this.isLegendVisible;
    }
}
