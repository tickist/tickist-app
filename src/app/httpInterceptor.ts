
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpErrorResponse, HttpEvent
} from "@angular/common/http";
import {Observable} from "rxjs/Observable";
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/finally';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/take';
import {ConfigurationService} from "./services/configurationService";
import {Router, RouterState, RouterStateSnapshot} from "@angular/router";
import {Injectable} from "@angular/core";


@Injectable()
export class RequestInterceptorService implements HttpInterceptor {
  state: RouterState;
  snapshot: RouterStateSnapshot;

  // constructor(protected router: Router, protected configurationService: ConfigurationService) {
  constructor(protected router: Router, protected configurationService: ConfigurationService) {
    this.state = this.router.routerState;
    this.snapshot = this.state.snapshot;
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
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
            if (status === 0) {
                this.configurationService.updateDetectApiError(true);
            }
            //if (status >= 401) {
            //  this.configurationService.updateDetectApiError(true);
            //} else {
            //  this.configurationService.updateDetectApiError(false);
            //}

            return Observable.throw(error);
          }
        }
      );
  }
}
