import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {TagService} from '../../services/tag.service';
import {Observable} from 'rxjs';
import {RequestsAllTags} from '../../tags/tags.actions';
import {Store} from '@ngrx/store';
import {AppStore} from '../../store';

@Injectable()
export class TagsResolver implements Resolve<any> {
    constructor(private store: Store<AppStore>) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
        return  this.store.dispatch(new RequestsAllTags());
    }
}
