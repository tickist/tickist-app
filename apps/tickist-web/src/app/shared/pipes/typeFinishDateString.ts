import {Pipe, PipeTransform} from '@angular/core';
import {ConfigurationService} from '../../core/services/configuration.service';

@Pipe({
  name: 'typeFinishDateString'
})
export class TypeFinishDateString implements PipeTransform {

  constructor(protected configurationService: ConfigurationService) {
  }

  transform(value: any, args: string[]): any {
    if (value) {
      return this.configurationService.loadConfiguration()['commons']['TYPE_FINISH_DATE_OPTIONS'][value].name;
    }
  }
}
