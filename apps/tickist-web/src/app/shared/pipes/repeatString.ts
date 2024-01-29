import { Pipe, PipeTransform } from "@angular/core";
import { ConfigurationService } from "../../core/services/configuration.service";

@Pipe({
    name: "repeatstring",
    standalone: true,
})
export class RepeatString implements PipeTransform {
    constructor(private configrationService: ConfigurationService) {}

    transform(value: any): any {
        if (value) {
            return this.configrationService.loadConfiguration()["commons"]["REPEATING_OPTIONS"][value].name;
        }
    }
}
