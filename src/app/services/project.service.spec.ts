import {ProjectService} from './project.service';
import {getTestBed, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {TickistMaterialModule} from '../material.module';
import {MockTasksFiltersService} from '../testing/mocks/tasks-filters-service';
import {StoreModule} from '@ngrx/store';
import {RouterModule} from '@angular/router';
import {reducers} from '../store';
import {APP_BASE_HREF} from '@angular/common';
import {Project} from '../models/projects';

const project1FromApi = {
    name: 'F project',
    id: 1,
    get_all_descendants: [3, 4],
    level: 0,
    is_active: true,
    is_inbox: false,
    share_with: []
};

const project2FromApi = {
    name: 'Z project',
    id: 2,
    get_all_descendants: [],
    level: 0,
    is_active: true,
    is_inbox: true,
    share_with: []
};

const project3FromApi = {
    name: 'B project',
    id: 3,
    get_all_descendants: [],
    level: 1,
    is_active: true,
    is_inbox: false,
    share_with: []
};

const project4FromApi = {
    name: 'C project',
    id: 4,
    get_all_descendants: [5, 6],
    level: 1,
    is_active: true,
    is_inbox: false,
    share_with: []
};

const project5FromApi = {
    name: 'P project',
    id: 5,
    get_all_descendants: [],
    level: 2,
    is_active: true,
    is_inbox: false,
    share_with: []
};

const project6FromApi = {
    name: 'E project',
    id: 6,
    get_all_descendants: [],
    level: 2,
    is_active: true,
    is_inbox: false,
    share_with: []
};

const project7FromApi = {
    name: 'X project',
    id: 7,
    get_all_descendants: [],
    level: 0,
    is_active: true,
    is_inbox: false,
    share_with: []
};



describe('Project service', () => {
    let injector: TestBed;
    let httpMock: HttpTestingController;
    let service: ProjectService;

    beforeEach(() => {
        const tasksFiltersService = new MockTasksFiltersService();
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, TickistMaterialModule, StoreModule.forRoot(reducers), RouterModule.forRoot([])],
            providers: [
                ProjectService,
                tasksFiltersService.getProviders(),
                {provide: APP_BASE_HREF, useValue: '/'}
                ]
        });
        injector = getTestBed();
        service = injector.get(ProjectService);
        httpMock = injector.get(HttpTestingController);

    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be defined', () => {
        expect(service).toBeTruthy();
    });
});
