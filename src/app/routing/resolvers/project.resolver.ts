import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Project} from '../../models/projects';
import {ProjectService} from '../../services/project.service';
import {Observable} from 'rxjs';

@Injectable()
export class ProjectsResolver implements Resolve<Project> {
    constructor(private projectService: ProjectService) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
        return this.projectService.loadProjects();
    }
}
