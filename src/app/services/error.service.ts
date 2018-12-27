import {environment} from '../../environments/environment';
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ConfigurationService} from './configuration.service';


@Injectable()
export class ErrorService {
    constructor(private http: HttpClient, protected configurationService: ConfigurationService) {
    }

    logError(error: Error, location, user): void {
        // if (!environment.production) {
        //   return;
        // }
        if (environment.e2eTest) return;

        const url = `${environment.apiUrl}/log_errors/add`;
        const postBody = {'messege': error.message, 'stack': error.stack, 'location': location, 'user': user};
        this.http.post(url, postBody).subscribe((res) => {
            console.log('the error has been send');
            return res;
        });
    }

}
