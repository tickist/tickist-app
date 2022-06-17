import { Component, ChangeDetectionStrategy, Input } from "@angular/core";

@Component({
    selector: "tickist-no-tasks",
    templateUrl: "./no-tasks.component.html",
    styleUrls: ["./no-tasks.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoTasksComponent {
    @Input() tasksLength: number;
    constructor() {}
}
