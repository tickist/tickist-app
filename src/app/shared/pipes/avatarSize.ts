import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'avatarsize'
})
export class AvatarSize implements PipeTransform {
    transform(value: any, args: string[]): any {
        if (value) {
            const extension = value.slice(-4);
            return value.slice(0, -4) + '_' + args + extension;
        }
        return '';
    }
}


