import {Pipe, PipeTransform} from '@angular/core';
import {ConfigurationService} from '../services/configurationService';

@Pipe({
  name: 'repeatstringextension'
})
export class RepeatStringExtension implements PipeTransform {

  constructor(protected configurationService: ConfigurationService) {
  }

  transform(value: any, args: string[]): any {
    if (value) {
      return this.configurationService.loadConfiguration()['commons']['DEFAULT_REPEAT_OPTIONS'][value].name_of_extension;
    }

  }
}
