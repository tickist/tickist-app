import {Component, OnInit, Input, OnChanges, ChangeDetectionStrategy} from '@angular/core';
import {Task} from '@data/tasks/models/tasks';

@Component({
    selector: 'tickist-task-name',
    templateUrl: './task-name.component.html',
    styleUrls: ['./task-name.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskNameComponent implements OnInit, OnChanges {
    @Input() task: Task;
    timeAndEstimateTime = false;
    onlyEstimateTime = false;
    onlyTime = false;
    tooltip = false;

    constructor() {
    }

    ngOnInit() {
    }

    ngOnChanges(changes: any) {
        if (changes['task'].currentValue.name.length > 60) {
            this.tooltip = true;
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
