import { Component, Input } from "@angular/core";

@Component({
    selector: "tickist-no-archived-tasks",
    templateUrl: "./no-archived-tasks.component.html",
    styleUrls: ["./no-archived-tasks.component.scss"],
})
export class NoArchivedTasksComponent {
    @Input() tasksLength: number;

    constructor() {}
}
