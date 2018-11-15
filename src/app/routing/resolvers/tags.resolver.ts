import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {TagService} from '../../services/tag-service';
import {Observable} from 'rxjs';

@Injectable()
export class TagsResolver implements Resolve<any> {
    constructor(private tagService: TagService) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
        return this.tagService.loadTags();
    }
}
