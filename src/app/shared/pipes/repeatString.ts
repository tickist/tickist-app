import {Pipe, PipeTransform} from '@angular/core'
import {ConfigurationService} from '../../services/configurationService'

@Pipe({
  name: 'repeatstring'
})
export class RepeatString implements PipeTransform {

  constructor(private configrationService: ConfigurationService) {
  }

  transform(value: any, args: string[]): any {
    if (value) {
      return this.configrationService.loadConfiguration()['commons']['REPEATING_OPTIONS'][value].name
    }

  }
}
