import { ChangeDetectionStrategy, Component, Input, OnChanges } from "@angular/core";
import { AVAILABLE_TASK_TYPES, AVAILABLE_TASK_TYPES_ICONS, Task } from "@data";
import { zip } from "ramda";

@Component({
    selector: "tickist-task-type-label",
    templateUrl: "./task-type-label.component.html",
    styleUrls: ["./task-type-label.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskTypeLabelComponent implements OnChanges {
    @Input() task: Task;
    taskTypesWithIcons: any;
    icon: any;

    constructor() {
        this.taskTypesWithIcons = zip(AVAILABLE_TASK_TYPES, AVAILABLE_TASK_TYPES_ICONS).map((taskType) => ({
            value: taskType[0],
            icon: taskType[1],
        }));
    }

    ngOnChanges() {
        this.icon = this.taskTypesWithIcons.find((taskType) => taskType.value === this.task.taskType)?.icon;
    }
}
