import {ChangeDetectionStrategy, Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {Task} from '../../models/tasks/tasks';
import {editTaskRoutesName} from '../../modules/edit-task/routes-names';
import {Router} from '@angular/router';
import {homeRoutesName} from '../../routing.module.name';


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

    emitOnMenuClose($event) {
        this.fastMenuClose.emit(false);
    }

    emitOnMenuOpen() {
        this.fastMenuOpen.emit(true);
    }

    emitTogglePinClickEvent() {
        this.togglePinClick.emit();

    }

    navigateToEditTaskView(taskId: number) {
        this.router.navigate([homeRoutesName.HOME, {outlets: {content: [editTaskRoutesName.EDIT_TASK, taskId]}}]);
    }

}
