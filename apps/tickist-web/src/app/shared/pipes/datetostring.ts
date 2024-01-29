import {Pipe, PipeTransform} from '@angular/core';
import {format, isDate, isToday, isTomorrow, isYesterday, parse} from 'date-fns';

@Pipe({
    name: 'datetostring',
    standalone: true
})
export class DateToString implements PipeTransform {
    transform(value: Date | string): string {
        if (value) {
            let result;
            if (isDate(value)) {
                result = value;
            } else {
                result = parse(<string> value, 'dd-MM-yyyy', new Date());
            }
            if (isToday(result)) {
                return 'today';
            } else if (isTomorrow(result)) {
                return 'tomorrow';
            } else if (isYesterday(result)) {
                return 'yesterday';
            }
            return format(result, 'EEEE');
        }
        return <string> value;

    }
}
