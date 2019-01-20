import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Project} from '../../models/projects';
import {ProjectService} from '../../services/project.service';
import {Observable} from 'rxjs';
import {RequestsAllProjects} from '../../projects/projects.actions';
import {AppStore} from '../../store';
import {Store} from '@ngrx/store';

@Injectable()
export class ProjectsResolver implements Resolve<Project> {
    constructor(private store: Store<AppStore>) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
        return this.store.dispatch(new RequestsAllProjects());
    }
}
