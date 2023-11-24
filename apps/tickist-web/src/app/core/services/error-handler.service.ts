import { ErrorHandler, Injectable, Injector } from "@angular/core";
import { ErrorService } from "./error.service";
import { NGXLogger } from "ngx-logger";

@Injectable({
    providedIn: "root",
})
export class MyErrorHandler implements ErrorHandler {
    errorService: ErrorService;

    constructor(
        private injector: Injector,
        private logger: NGXLogger,
    ) {}

    handleError(error: any): void {
        if (!this.errorService) {
            this.errorService = <ErrorService>this.injector.get(ErrorService);
        }
        try {
            this.errorService.logError();
            console.group("ErrorHandler");
            console.error(error.message);
            console.error(error.stack);
            console.groupEnd();
        } catch (handlingError) {
            this.logger.error(handlingError);
        }
    }
}
