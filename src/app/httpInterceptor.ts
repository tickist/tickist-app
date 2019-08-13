import {throwError as observableThrowError, Observable} from 'rxjs';

import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpErrorResponse, HttpEvent
} from '@angular/common/http';


import {ConfigurationService} from './core/services/configuration.service';
import {Router, RouterState, RouterStateSnapshot} from '@angular/router';
import {Injectable} from '@angular/core';
import {catchError} from 'rxjs/operators';
import {Logout} from './core/actions/auth.actions';
import {AppStore} from './store';
import {Store} from '@ngrx/store';


@Injectable()
export class RequestInterceptorService implements HttpInterceptor {
    state: RouterState;
    snapshot: RouterStateSnapshot;

    constructor(protected router: Router, protected configurationService: ConfigurationService, private store: Store<AppStore>) {
        this.state = this.router.routerState;
        this.snapshot = this.state.snapshot;
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            catchError(error => {
                    if (error instanceof HttpErrorResponse) {
                        const status = (<HttpErrorResponse>error).status;
                        if (status === 401 || status === 403) {
                            console.log(this.snapshot.url);
                            if (this.snapshot.url !== '/login') {
                                this.router.navigate(['login']);
                            }
                            console.log('The authentication session expires or the user is not authorised. ' +
                                'Force remove token and username from localstorage.');
                            this.store.dispatch(new Logout());
                        }
                        if (status === 0) {
                            this.configurationService.updateDetectApiError(true);
                        }
                        // if (status >= 401) {
                        //  this.configurationService.updateDetectApiError(true);
                        // } else {
                        //  this.configurationService.updateDetectApiError(false);
                        // }

                        return observableThrowError(error);
                    }
                }
            ));
    }
}
