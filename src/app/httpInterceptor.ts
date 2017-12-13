import {Injectable} from "@angular/core";
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpSentEvent,
  HttpHeaderResponse,
  HttpProgressEvent,
  HttpResponse,
  HttpUserEvent,
  HttpErrorResponse
} from "@angular/common/http";
import {Observable} from "rxjs/Observable";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/finally';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/take';
import {ConfirmationService} from "primeng/primeng";


export class RequestInterceptorService implements HttpInterceptor {

  isRefreshingToken: boolean = false;
  tokenSubject: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  constructor(private router: Route, protected configurationService: ConfirmationService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpSentEvent | HttpHeaderResponse | HttpProgressEvent | HttpResponse<any> | HttpUserEvent<any>> {
    return next.handle(req)
      .catch(error => {
          if (error instanceof HttpErrorResponse) {
            const status = (<HttpErrorResponse>error).status;
            if (status === 401 || status === 403) {
              console.log(this.snapshot.url);
              if (this.snapshot.url !== '/login') {
                this.router.navigate(['login']);
              }
              console.log('The authentication session expires or the user is not authorised. Force remove token and username from localstorage.');
              localStorage.removeItem('JWT');
              localStorage.removeItem('USERNAME');
            }
            if (status >= 401) {
              this.configurationService.updateDetectApiError(true);
            } else {
              this.configurationService.updateDetectApiError(false);
            }

            return Observable.throw(error);
          }
        }
      );
  }
}
