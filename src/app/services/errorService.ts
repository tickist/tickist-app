import {environment} from '../../environments/environment';
import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";


@Injectable()
export class ErrorService {
  constructor(private http: HttpClient) {
  }

  logError(error: Error, location, user) {
    // if (!environment.production) {
    //   return;
    // }
    const url = `${environment.apiUrl}/log_errors/add`;
    const postBody = {'messege': error.message, 'stack': error.stack, 'location': location, 'user': user};
    this.http.post(url, postBody).subscribe((res) => {
      console.log('the error has been send');
      return res;
    });
  }
}
