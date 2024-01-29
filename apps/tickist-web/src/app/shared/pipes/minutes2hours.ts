import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'minutes2hours',
    standalone: true
})
export class Minutes2hoursPipe implements PipeTransform {
    transform(value: number): any {
        let hours;
        let minutes;
        let result;
        if (value) {
            hours = Math.floor(value / 60);
            minutes = value % 60;
            if (hours > 0 && minutes > 0) {
                result = hours + 'h ' + minutes + 'm';
            } else if (hours === 0 && minutes > 0) {
                result = minutes + 'm';
            } else if (hours > 0 && minutes === 0) {
                result = hours + 'h';
            }
            return result;
        } else {
            return minutes;
        }
    }
}
