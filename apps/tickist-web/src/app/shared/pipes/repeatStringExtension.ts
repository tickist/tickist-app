import { Pipe, PipeTransform } from "@angular/core";
import { ConfigurationService } from "../../core/services/configuration.service";

@Pipe({
    name: "repeatstringextension",
})
export class RepeatStringExtension implements PipeTransform {
    constructor(protected configurationService: ConfigurationService) {}

    transform(value: any, args: string[]): any {
        if (value) {
            return this.configurationService.loadConfiguration().commons
                .defaultRepeatOptions[value].name_of_extension;
        }
    }
}
