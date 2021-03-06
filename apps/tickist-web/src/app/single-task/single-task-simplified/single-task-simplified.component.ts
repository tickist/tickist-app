import {ChangeDetectionStrategy, Component, HostListener, Input, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {TaskService} from '../../core/services/task.service';
import {SingleTask} from '../shared/single-task';
import {AppStore} from '../../store';
import {Store} from '@ngrx/store';
import {IconProp} from '@fortawesome/fontawesome-svg-core';


@Component({
    selector: 'tickist-single-task-simplified',
    templateUrl: './single-task-simplified.component.html',
    styleUrls: ['./single-task-simplified.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SingleTaskSimplifiedComponent extends SingleTask implements OnInit {
    @Input() task;
    icon: IconProp;
    finishDateVisible = true;

    @HostListener('mouseenter')
    onMouseEnter(): void {
        this.isMouseOver = true;
        this.changeRightMenuVisiblity();
        this.isRightMenuVisible = true;
    }

    @HostListener('mouseleave')
    onMouseLeave(): void {
        this.isMouseOver = false;
        this.changeRightMenuVisiblity();
        if (!this.isFastMenuVisible) {
            this.isRightMenuVisible = false;
        }

    }

    constructor(public dialog: MatDialog, public store: Store) {
        super(store, dialog);
    }

    ngOnInit() {
        if (this.task.isDone && !this.task.onHold) {
            this.icon = ['far', 'check-square'];
        } else if (!this.task.isDone && !this.task.onHold) {
            this.icon = ['far', 'square'];
        } else if (this.task.onHold) {
            this.icon = ['fas', 'pause'];
        }
    }

    changeRightMenuVisiblity(): void {
        if (this.isMouseOver) {
            this.isRightMenuVisible = true;
            this.finishDateVisible = false;
        }
        if (!this.isMouseOver && this.isFastMenuVisible) {
            this.isRightMenuVisible = true;
            this.finishDateVisible = false;
        }
        if (!this.isMouseOver && !this.isFastMenuVisible) {
            this.isRightMenuVisible = false;
            this.finishDateVisible = true;
        }
    }

    changeFastMenuVisible(value: boolean): void {
        this.isFastMenuVisible = value;
        this.changeRightMenuVisiblity();
    }

}
