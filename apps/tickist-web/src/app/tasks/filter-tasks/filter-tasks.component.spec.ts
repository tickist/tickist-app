import {TickistMaterialModule} from '../../material.module';
import {FilterTasksComponent} from './filter-tasks.component';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MockProjectService} from '../../testing/mocks/project-service';
import {MockConfigurationService} from '../../testing/mocks/configurationService';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {MockTasksFiltersService} from '../../testing/mocks/tasks-filters-service';
import {StoreModule} from '@ngrx/store';


let comp: FilterTasksComponent;
let fixture: ComponentFixture<FilterTasksComponent>;


describe('Component: ForgotPassword', () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const configurationService = new MockConfigurationService();
        const tasksFiltersService = new MockTasksFiltersService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, StoreModule.forRoot({})],
            declarations: [FilterTasksComponent],
            providers: [
                projectService.getProviders(),
                configurationService.getProviders(),
                tasksFiltersService.getProviders()
            ],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(FilterTasksComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
