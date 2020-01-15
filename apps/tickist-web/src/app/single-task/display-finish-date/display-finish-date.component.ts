import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChange} from '@angular/core';
import {Task} from '@data/tasks/models/tasks';
import {format} from 'date-fns';


@Component({
    selector: 'tickist-display-finish-date',
    templateUrl: './display-finish-date.component.html',
    styleUrls: ['./display-finish-date.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisplayFinishDateComponent implements OnInit, OnChanges {
    @Input() task: Task;
    statusOn = false;
    statusBy = false;

    dateFormat = 'dd-MM-yyyy';
    finishDateFormat: string;

    constructor() {
    }

    ngOnInit() {
        if (!this.task) {
            throw new Error(`Attribute 'task' is required`);
        }

    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        if (changes.hasOwnProperty('task')) {
            this.statusOn = this.task.typeFinishDate === 1;
            this.statusBy = this.task.typeFinishDate === 0;
            this.finishDateFormat = format(this.task.finishDate, this.dateFormat);
        }
    }
}
