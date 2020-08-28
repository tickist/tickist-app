import {ChangeDetectionStrategy, Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {Task} from '@data/tasks/models/tasks';
import {editTaskRoutesName} from '../../modules/edit-task/routes-names';
import {Router} from '@angular/router';
import {homeRoutesName} from '../../routing.module.name';
import {TaskType} from "@data";


@Component({
    selector: 'tickist-right-menu',
    templateUrl: './right-menu.component.html',
    styleUrls: ['./right-menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
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
    @Output() convertTo = new EventEmitter()
    normalTaskType = TaskType.NORMAL;
    nextActionTaskType = TaskType.NEXT_ACTION;
    needInfoTaskType = TaskType.NEED_INFO;

    constructor(private router: Router) {
    }

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
        this.router.navigate([homeRoutesName.HOME, editTaskRoutesName.EDIT_TASK, taskId]);
    }

    emitConvertToEvent(taskType) {
        this.convertTo.emit(taskType)
    }

}
