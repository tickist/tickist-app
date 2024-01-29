import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    OnChanges,
    OnInit,
    ViewChild
} from '@angular/core';
import {Task} from '@data/tasks/models/tasks';
import { formatDate, NgIf } from "@angular/common";
import { Minutes2hoursPipe } from '../../shared/pipes/minutes2hours';
import { AngularResizeEventModule } from 'angular-resize-event';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FlexModule } from '@ngbracket/ngx-layout/flex';

@Component({
    selector: 'tickist-task-name',
    templateUrl: './task-name.component.html',
    styleUrls: ['./task-name.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [FlexModule, NgIf, MatTooltipModule, AngularResizeEventModule, Minutes2hoursPipe]
})
export class TaskNameComponent implements OnInit, OnChanges {
    @Input() task: Task;
    @ViewChild('taskNameDiv') el: ElementRef;
    timeAndEstimateTime = false;
    onlyEstimateTime = false;
    onlyTime = false;
    tooltip = false;
    whenComplete = '';

    constructor(private cd: ChangeDetectorRef) {
    }

    ngOnInit() {
        this.whenComplete = this.task.whenComplete ? ` (${formatDate(this.task.whenComplete, 'MMM d, y, hh:mm:ss', 'en')})` : ''

    }

    onResized() {
        if (this.el.nativeElement.offsetWidth < this.el.nativeElement.scrollWidth && !this.tooltip) {
            this.tooltip = true;
            this.cd.detectChanges()
        } else if (this.el.nativeElement.offsetWidth >= this.el.nativeElement.scrollWidth && this.tooltip ) {
            this.tooltip = false;
            this.cd.detectChanges()
        }
    }

    ngOnChanges(changes: any) {
        if (changes['task']) {
            if (!this.task.richName) {
                this.task.richName = this.task.name;
            }
        }
        if (changes['task'].currentValue.estimateTime && changes['task'].currentValue.time) {
            this.onlyEstimateTime = this.onlyTime = false;
            this.timeAndEstimateTime = true;
        }
        if (changes['task'].currentValue.estimateTime && !changes['task'].currentValue.time) {
            this.onlyTime = this.timeAndEstimateTime = false;
            this.onlyEstimateTime = true;
        }
        if (!changes['task'].currentValue.estimateTime && changes['task'].currentValue.time) {
            this.onlyEstimateTime = this.timeAndEstimateTime = false;
            this.onlyTime = true;
        }

    }
}
