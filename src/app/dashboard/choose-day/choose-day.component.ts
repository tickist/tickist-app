import {ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output} from '@angular/core';
import * as moment from 'moment';
import {ConfigurationService} from '../../services/configurationService';
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
    @Output() onSelectedDate = new EventEmitter();
    selectedDate: FormControl;
    
    constructor(protected configurationService: ConfigurationService) {
    }
    
    ngOnInit() {
        this.selectedDate = new FormControl({value: '', disabled: true});
        this.configurationService.activeDateElement$.subscribe((activeDateElement: IActiveDateElement) => {
            if (activeDateElement.state === stateActiveDateElement.future) {
                this.selectedDate.setValue('');
            } else if (activeDateElement.state === stateActiveDateElement.weekdays) {
                const today = moment();
                const diffAbsTodaySelectedDate = Math.abs(today.diff(moment(this.selectedDate.value), 'days'));
                if (diffAbsTodaySelectedDate < 7) {
                    this.selectedDate.setValue('');
                }
                const diffAbsTodayActiveDay = Math.abs(today.diff(moment(activeDateElement.date), 'days'));
                if (diffAbsTodayActiveDay > 7 && moment.isMoment(activeDateElement.date)) {
                    this.selectedDate.setValue( activeDateElement.date.toDate());
                }
            }
        });
        
    }
    
    emitOnSelectedDate() {
        if (this.selectedDate.value) {
            this.onSelectedDate.emit(moment(this.selectedDate.value).format('DD-MM-YYYY'));
        }
    }
}
