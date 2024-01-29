import { Component } from "@angular/core";
import { GlobalStatisticsComponent } from "../../components/global-statistics/global-statistics.component";
import { DayStatisticsComponent } from "../../components/day-statistics/day-statistics.component";

@Component({
    selector: "tickist-statistics",
    templateUrl: "./statistics.component.html",
    styleUrls: ["./statistics.component.scss"],
    standalone: true,
    imports: [DayStatisticsComponent, GlobalStatisticsComponent],
})
export class StatisticsComponent {
    constructor() {}
}
