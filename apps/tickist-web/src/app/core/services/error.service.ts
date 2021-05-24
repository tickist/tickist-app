import {environment} from '../../../environments/environment';
import {Injectable} from '@angular/core';
import {ConfigurationService} from './configuration.service';


@Injectable({
    providedIn: 'root',
})
export class ErrorService {
    constructor(private configurationService: ConfigurationService) {
    }

    logError(error: Error, location, user): void {
        // if (!environment.production) {
        //   return;
        // }
        if (environment.e2eTest) return;

        // const url = `${environment.apiUrl}/log_errors/add`;
        // const postBody = {'messege': error.message, 'stack': error.stack, 'location': location, 'user': user};
        // this.http.post(url, postBody).subscribe((res) => {
        //     console.log('the error has been send');
        //     return res;
        // });
    }

}
