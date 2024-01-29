import { Pipe, PipeTransform } from "@angular/core";
import { ConfigurationService } from "../../core/services/configuration.service";

@Pipe({
    name: "typeFinishDateString",
    standalone: true,
})
export class TypeFinishDateString implements PipeTransform {
    constructor(protected configurationService: ConfigurationService) {}

    transform(value: any): any {
        if (value) {
            return this.configurationService.loadConfiguration().commons.typeFinishDateOptions[value].name;
        }
    }
}
