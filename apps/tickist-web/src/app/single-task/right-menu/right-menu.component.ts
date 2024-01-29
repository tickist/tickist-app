import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnInit,
    Output,
    EventEmitter,
} from "@angular/core";
import { Task } from "@data/tasks/models/tasks";
import { editTaskRoutesName } from "../../modules/edit-task/routes-names";
import { Router } from "@angular/router";
import { homeRoutesName } from "../../routing.module.name";
import { TaskType } from "@data";
import { MatButtonModule } from "@angular/material/button";
import { ExtendedModule } from "@ngbracket/ngx-layout/extended";
import { PriorityComponent } from "../../shared/components/priority/priority.component";
import { MatMenuModule } from "@angular/material/menu";
import { DataCyDirective } from "../../shared/directives/data-cy.directive";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MenuButtonComponent } from "../../shared/components/menu-button/menu-button.component";
import { PinButtonComponent } from "../pin-button/pin-button.component";
import { NgIf, NgStyle } from "@angular/common";

@Component({
    selector: "tickist-right-menu",
    templateUrl: "./right-menu.component.html",
    styleUrls: ["./right-menu.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        NgIf,
        PinButtonComponent,
        MenuButtonComponent,
        MatTooltipModule,
        DataCyDirective,
        MatMenuModule,
        PriorityComponent,
        NgStyle,
        ExtendedModule,
        MatButtonModule,
    ],
})
export class RightMenuComponent implements OnInit {
    @Input() task: Task;
    @Input() isRightMenuVisible = false;
    @Output() deleteTaskClick = new EventEmitter();
    @Output() changeDateClick = new EventEmitter();
    @Output() changePriorityClick = new EventEmitter();
    @Output() togglePinClick = new EventEmitter();
    @Output() fastMenuOpen = new EventEmitter();
    @Output() fastMenuClose = new EventEmitter();
    @Output() convertTo = new EventEmitter();
    normalTaskType = TaskType.normal;
    nextActionTaskType = TaskType.nextAction;
    needInfoTaskType = TaskType.needInfo;

    constructor(private router: Router) {}

    ngOnInit() {
        if (!this.task) {
            throw new Error(`Attribute 'task' is required`);
        }
    }

    emitDeleteTaskEvent() {
        this.deleteTaskClick.emit();
    }

    emitChangeDataClickEvent(date) {
        this.changeDateClick.emit(date);
    }

    emitChangePriorityClickEvent($event) {
        this.changePriorityClick.emit($event);
    }

    emitOnMenuClose() {
        this.fastMenuClose.emit(false);
    }

    emitOnMenuOpen() {
        this.fastMenuOpen.emit(true);
    }

    emitTogglePinClickEvent() {
        this.togglePinClick.emit();
    }

    navigateToEditTaskView(taskId: string) {
        this.router.navigate([
            homeRoutesName.home,
            editTaskRoutesName.editTask,
            taskId,
        ]);
    }

    emitConvertToEvent(taskType) {
        this.convertTo.emit(taskType);
    }
}
