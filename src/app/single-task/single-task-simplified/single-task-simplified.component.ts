import {ChangeDetectionStrategy, Component, HostListener, Input} from '@angular/core';
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
export class SingleTaskSimplifiedComponent extends SingleTask {
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

    constructor(public dialog: MatDialog, public store: Store<AppStore>) {
        super(store, dialog);
    }

    ngOnInit() {
        switch (this.task.status) {
            case 0:
                this.icon = ['far', 'square'];
                break;
            case 1:
                this.icon = ['far', 'check-square'];
                break;
            case 2:
                this.icon = ['fas', 'pause'];
                break;
            default:
                break;
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
