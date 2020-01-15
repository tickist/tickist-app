import {SpyObject} from '../test.helpers';
import {ProjectService} from '../../core/services/project.service';
import {of} from 'rxjs';


export class MockProjectService extends SpyObject {
    fakeResponse;
    responseSuccess: boolean;
    team$: any;
    selectedProjectsIds$: any;
    projects$: any;
    selectedProject$: any;

    constructor() {
        super(ProjectService);

        this.fakeResponse = null;
        this.responseSuccess = true;
        this.team$ = of([]);
        this.selectedProjectsIds$ = of([]);
        this.selectedProject$ = of([]);
        this.projects$ = of([]);
    }

    subscribe(success, error) {
        if (this.responseSuccess) {
            success(this.fakeResponse);
        } else {
            error(this.fakeResponse);
        }
    }

    setErrorResponse() {
        this.responseSuccess = false;
    }

    setResponse(json: any): void {
        this.fakeResponse = json;
    }

    getProviders(): Array<any> {
        return [{provide: ProjectService, useValue: this}];
    }
}
