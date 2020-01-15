import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {tap} from 'rxjs/operators';
import {RouterNavigatedAction, ROUTER_NAVIGATED} from '@ngrx/router-store';
import {environment} from '../../../environments/environment';


@Injectable()
export class GaEffects {

    @Effect({dispatch: false})
    ga$ = this.actions$
        .pipe(
            ofType<RouterNavigatedAction>(ROUTER_NAVIGATED),
            tap((action) => {
                if (environment.production) {
                    ga('set', 'page', action.payload.event.urlAfterRedirects);
                    ga('send', 'pageview');
                }
            })
        );

    constructor(private actions$: Actions) {
    }

}
