import {ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output, ViewEncapsulation} from '@angular/core';
import * as moment from 'moment';
import {ConfigurationService} from '../../services/configurationService';
import {FormControl} from '@angular/forms';

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
        this.configurationService.activeDay$.subscribe((activeDay) => {
            const today = moment();
            const diffAbsTodaySelectedDate = Math.abs(today.diff(moment(this.selectedDate.value), 'days'));
            if (diffAbsTodaySelectedDate < 7) {
                this.selectedDate.setValue('');
            }
            const diffAbsTodayActiveDay = Math.abs(today.diff(moment(activeDay), 'days'));
            if (diffAbsTodayActiveDay > 7) {
                this.selectedDate.setValue(activeDay.toDate());
            }
        });
        
    }
    
    emitOnSelectedDate() {
        if (this.selectedDate.value) {
            this.onSelectedDate.emit(moment(this.selectedDate.value).format('DD-MM-YYYY'));
        }
    }
}
