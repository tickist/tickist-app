import {Pipe, PipeTransform} from '@angular/core';
import truncate from 'truncate-html';

@Pipe({
    name: 'truncate',
    pure: true
})
export class TruncatePipe implements PipeTransform {
    transform(value: string, arg1?, arg2?): string {
        if (value) {
            const limit = arg1 ? parseInt(arg1, 10) : 10;
            const trail = arg2 ? arg2 : '...';
            const options = {ellipsis: trail};

            return value.length > limit ? truncate(value, limit, options) : value;
        }

        return value;
    }
}
