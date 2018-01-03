import {ChangeDetectionStrategy, Component, Input, OnInit, Output, EventEmitter, HostListener} from '@angular/core';
import {TaskService} from '../../services/taskService';
import {Task} from '../../models/tasks';

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
    @Output() onFastMenuOpen = new EventEmitter();
    @Output() onFastMenuClose = new EventEmitter();

    constructor(public taskService: TaskService) {
    }

    ngOnInit() {
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
        this.onFastMenuClose.emit(false);
    }

    emitOnMenuOpen() {
        this.onFastMenuOpen.emit(true);
    }

    emitTogglePinClickEvent() {
        this.togglePinClick.emit();

    }

}
