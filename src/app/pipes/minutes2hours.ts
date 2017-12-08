import {Pipe, PipeTransform} from '@angular/core'

@Pipe({
  name: 'minutes2hours'
})
export class Minutes2hoursPipe implements PipeTransform {
  transform(minutes: number) : any {
    if (minutes){
        var hours = Math.floor(minutes/60),
            minutes = minutes%60,
            result;
        if (hours > 0 && minutes > 0) {
            result = hours + "h " + minutes + "m";
        } else if (hours === 0 && minutes > 0) {
            result = minutes + "m";
        } else if (hours > 0 && minutes === 0) {
            result = hours + "h";
        }
        return result;
    } else {
        return minutes;
    }

    }
}
