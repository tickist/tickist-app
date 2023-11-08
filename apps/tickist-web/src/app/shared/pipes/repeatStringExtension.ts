import { Pipe, PipeTransform } from "@angular/core";
import { ConfigurationService } from "../../core/services/configuration.service";

@Pipe({
    name: "repeatstringextension",
    standalone: true,
})
export class RepeatStringExtension implements PipeTransform {
    constructor(protected configurationService: ConfigurationService) {}

    transform(value: any): any {
        if (value) {
            return this.configurationService.loadConfiguration().commons.defaultRepeatOptions[value].nameOfExtension;
        }
    }
}
