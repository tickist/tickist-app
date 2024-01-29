import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { TaskService } from "../../core/services/task.service";
import {  MatDialog } from "@angular/material/dialog";
import { User } from "@data/users";
import { TASK_EXTENDED_VIEW, TASK_SIMPLE_VIEW } from "@data";
import { SingleTaskSimplifiedComponent } from "../single-task-simplified/single-task-simplified.component";
import { SingleTaskExtendedComponent } from "../single-task-extended/single-task-extended.component";
import { NgIf } from "@angular/common";

@Component({
    selector: "tickist-single-task",
    templateUrl: "./single-task.component.html",
    styleUrls: ["./single-task.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        NgIf,
        SingleTaskExtendedComponent,
        SingleTaskSimplifiedComponent,
    ],
})
export class SingleTaskComponent {
    @Input() task;
    @Input() mediaChange;
    @Input() taskView;
    @Input() last;
    @Input() user: User;
    taskSimpleViewValue = TASK_SIMPLE_VIEW.value;
    taskExtendedViewValue = TASK_EXTENDED_VIEW.value;
    constructor(public taskService: TaskService, public dialog: MatDialog) {}
}
