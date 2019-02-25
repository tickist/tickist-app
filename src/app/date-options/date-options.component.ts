import {Component, OnInit, Input, ChangeDetectionStrategy, ViewChild} from '@angular/core';
import {ConfigurationService} from '../services/configuration.service';
import {Task} from '../models/tasks';
import * as moment from 'moment';
import {UpdateTask} from '../core/actions/task.actions';
import {Store} from '@ngrx/store';
import {AppStore} from '../store';


@Component({
    selector: 'app-date-options',
    templateUrl: './date-options.html',
    styleUrls: ['./date-options.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateOptionsComponent implements OnInit {

    typeFinishDateOptions: {};
    minDate: Date;
    typeFinishDate: number;
    finishDate: any;
    finishTime: any;
    minFilter: any;
    @Input() task: Task;
    @ViewChild('finishDateInputViewChild') finishDateInputViewChild;
    @ViewChild('finishTimeInputViewChild') finishTimeInputViewChild;

    constructor(protected configurationService: ConfigurationService, private store: Store<AppStore>) {
        this.minDate = new Date();
    }

    ngOnInit() {
         if (this.task === null) {
            throw new Error(`Attribute 'task' is required`);
        }
        this.typeFinishDateOptions = this.configurationService.loadConfiguration()['commons']['TYPE_FINISH_DATE_OPTIONS'];
        this.finishDate = this.task.finishDate.toDate();
        this.finishTime = this.task.finishTime;
        this.typeFinishDate = this.task.typeFinishDate;
        this.createFinishDateFilter();
    }

    saveTask($event: any, source: string) {
        if (this.finishDateInputViewChild.valid) {
            if (source === 'typeFinishDate') {
                this.task.typeFinishDate = $event.value;
            } else if (source === 'finishDate') {

            } else if (source === 'finishTime') {

            }

            this.task.finishDate = this.finishDate ? moment(this.finishDate, 'DD-MM-YYYY') : '';
            this.task.finishTime = this.finishTime;
            this.store.dispatch(new UpdateTask({task: {id: this.task.id, changes: this.task}}));
        }

    }

    private createFinishDateFilter() {
        if (!this.finishDate || this.finishDate >= this.minDate) {
            this.minFilter = (d: Date): boolean => this.minDate.setHours(0, 0, 0, 0) <= d.setHours(0, 0, 0, 0);

        } else {
            this.minFilter = (d: Date): boolean => true;
        }
    }

    clearFinishDate($event) {

        this.finishDate = '';
        this.saveTask({'value': ''}, 'finishDate ');
        $event.stopPropagation();
    }

    clearFinishTime($event) {
        this.finishTime = '';
        this.saveTask({'value': null}, 'finishTime');
        $event.stopPropagation();
    }
}
