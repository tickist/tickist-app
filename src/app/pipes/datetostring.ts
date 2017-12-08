import {Pipe, PipeTransform} from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'datetostring'
})
export class DateToString implements PipeTransform {
  transform(value: any): any {
    console.log(value);
    if (value) {
      let result = moment(value, 'DD-MM-YYYY').format('dddd');
      if (moment(value, 'DD-MM-YYYY').hours(0).minutes(0).seconds(0).format('DD-MM-YYYY') === moment().hours(0).minutes(0).seconds(0).format('DD-MM-YYYY')) {
        result = 'today';
      } else if (moment(value, 'DD-MM-YYYY').format('DD-MM-YYYY') === moment().hours(0).minutes(0).seconds(0).add(1, 'days').format('DD-MM-YYYY')) {
        result = 'tomorrow';
      } else if (moment(value, 'DD-MM-YYYY').format('DD-MM-YYYY') === moment().hours(0).minutes(0).seconds(0).add(-1, 'days').format('DD-MM-YYYY')) {
        result = 'yesterday';
      }
      return result;
    } else {
      return value;
    }
  }
}
