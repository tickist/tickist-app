import { SpyObject } from "../test.helpers";
import { ProjectsFiltersService } from "../../modules/projects-list/projects-filters.service";

export class MockProjectsFiltersService extends SpyObject {
    currentTasksFilters$: any;

    constructor() {
        super(ProjectsFiltersService);
    }

    getProviders(): Array<any> {
        return [{ provide: ProjectsFiltersService, useValue: this }];
    }
}
