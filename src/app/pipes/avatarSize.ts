import {Pipe, PipeTransform} from '@angular/core'
import * as moment from 'moment'

@Pipe({
  name: 'avatarsize'
})
export class AvatarSize implements PipeTransform {
  transform(value: any, args: string[]): any {
    if (value) {
      let extension = value.slice(-4);
      return value.slice(0, -4) + '_' + args + extension
    } return ""
  }
}


