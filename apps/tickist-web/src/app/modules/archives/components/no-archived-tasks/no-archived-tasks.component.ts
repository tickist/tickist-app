import { Component, Input } from "@angular/core";
import { NgIf } from "@angular/common";

@Component({
    selector: "tickist-no-archived-tasks",
    templateUrl: "./no-archived-tasks.component.html",
    styleUrls: ["./no-archived-tasks.component.scss"],
    standalone: true,
    imports: [NgIf],
})
export class NoArchivedTasksComponent {
    @Input() tasksLength: number;

    constructor() {}
}
