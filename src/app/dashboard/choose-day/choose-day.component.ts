import {ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output} from '@angular/core';
import * as moment from 'moment';
import {ConfigurationService} from '../../services/configuration.service';
import {FormControl} from '@angular/forms';
import {IActiveDateElement} from '../../models/active-data-element.interface';
import {stateActiveDateElement} from '../../models/state-active-date-element.enum';

@Component({
    selector: 'tickist-choose-day',
    templateUrl: './choose-day.component.html',
    styleUrls: ['./choose-day.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChooseDayComponent implements OnInit {
    @Output() selectedDate = new EventEmitter();
    selectedDateFormControl: FormControl;

    constructor(protected configurationService: ConfigurationService) {
    }

    ngOnInit() {
        this.selectedDateFormControl = new FormControl({value: '', disabled: true});
        this.configurationService.activeDateElement$.subscribe((activeDateElement: IActiveDateElement) => {
            if (activeDateElement.state === stateActiveDateElement.future) {
                this.selectedDateFormControl.setValue('');
            } else if (activeDateElement.state === stateActiveDateElement.weekdays) {
                const today = moment();
                const diffAbsTodaySelectedDate = Math.abs(today.diff(moment(this.selectedDateFormControl.value), 'days'));
                if (diffAbsTodaySelectedDate < 7) {
                    this.selectedDateFormControl.setValue('');
                }
                const diffAbsTodayActiveDay = Math.abs(today.diff(moment(activeDateElement.date), 'days'));
                if (diffAbsTodayActiveDay > 7 && moment.isMoment(activeDateElement.date)) {
                    this.selectedDateFormControl.setValue( activeDateElement.date.toDate());
                }
            }
        });

    }

    emitOnSelectedDate() {
        if (this.selectedDateFormControl.value) {
            this.selectedDate.emit(moment(this.selectedDateFormControl.value).format('DD-MM-YYYY'));
        }
    }
}
