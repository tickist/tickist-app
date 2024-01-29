import { Component, ChangeDetectionStrategy, Input } from "@angular/core";
import { NgIf } from "@angular/common";

@Component({
    selector: "tickist-no-tasks",
    templateUrl: "./no-tasks.component.html",
    styleUrls: ["./no-tasks.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NgIf],
})
export class NoTasksComponent {
    @Input() tasksLength: number;
    constructor() {}
}
