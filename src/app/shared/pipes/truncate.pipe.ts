import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, arg1?, arg2?): string {
    if (value) {
      const limit = arg1 ? parseInt(arg1, 10) : 10;
      const trail = arg2 ? arg2 : '...';

      return value.length > limit ? value.substring(0, limit) + trail : value;
    } else {
      return value;
    }

  }
}
