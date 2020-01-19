import {Injectable, ErrorHandler, Injector} from '@angular/core';
import {ErrorService} from './error.service';

@Injectable({
  providedIn: 'root',
})
export class MyErrorHandler implements ErrorHandler {
  errorService: ErrorService;
  constructor(private injector: Injector) {
  }

  handleError(error: any): void {
    if (!this.errorService) {
      this.errorService = <ErrorService>this.injector.get(ErrorService);
    }
    try {
      this.errorService.logError(error, window.location.href, window.localStorage['USER_ID']);
      console.group('ErrorHandler');
      console.error(error.message);
      console.error(error.stack);
      console.groupEnd();
    } catch (handlingError) {
      console.log(handlingError);
    }
  }
}


