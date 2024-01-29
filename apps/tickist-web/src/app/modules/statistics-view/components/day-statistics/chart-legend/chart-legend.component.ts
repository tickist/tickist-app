import { Component, Input } from "@angular/core";
import { NgIf, NgFor, NgStyle } from "@angular/common";

@Component({
    selector: "tickist-chart-legend",
    templateUrl: "./chart-legend.component.html",
    styleUrls: ["./chart-legend.component.scss"],
    standalone: true,
    imports: [
        NgIf,
        NgFor,
        NgStyle,
    ],
})
export class ChartLegendComponent {
    @Input() data;
    isLegendVisible = false;

    constructor() {}

    changeLegendVisibility() {
        this.isLegendVisible = !this.isLegendVisible;
    }
}
