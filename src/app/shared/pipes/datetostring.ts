import {Pipe, PipeTransform} from '@angular/core';
import * as moment from 'moment';

@Pipe({
    name: 'datetostring'
})
export class DateToString implements PipeTransform {
    transform(value: any): any {
        if (value) {
            let result = moment(value, 'DD-MM-YYYY').format('dddd');
            const valueDateFormated: string = moment(value, 'DD-MM-YYYY').hours(0).minutes(0).seconds(0).format('DD-MM-YYYY');
            const todayDateFormated: string = moment().hours(0).minutes(0).seconds(0).format('DD-MM-YYYY');
            const tomorrowDateFormated: string =  moment().hours(0).minutes(0).seconds(0).add(1, 'days').format('DD-MM-YYYY');
            const yesterdayDateFormated: string =  moment().hours(0).minutes(0).seconds(0).add(-1, 'days').format('DD-MM-YYYY');
            if (valueDateFormated === todayDateFormated) {
                result = 'today';
            } else if (valueDateFormated === tomorrowDateFormated) {
                result = 'tomorrow';
            } else if (valueDateFormated === yesterdayDateFormated) {
                result = 'yesterday';
            }
            return result;
        } else {
            return value;
        }
    }
}
