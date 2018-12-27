import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {SingleTaskExtendedComponent} from './single-task-extended.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {MockTaskService} from '../../testing/mocks/task-service';
import {MockConfigurationService} from '../../testing/mocks/configurationService';
import {TickistMaterialModule} from '../../material.module';
import {MockProjectService} from '../../testing/mocks/project-service';

describe('SingleTaskExtendedComponent', () => {
    let component: SingleTaskExtendedComponent;
    let fixture: ComponentFixture<SingleTaskExtendedComponent>;

    beforeEach(async(() => {
        const tasksService = new MockTaskService();
        const projectService = new MockProjectService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule],
            declarations: [SingleTaskExtendedComponent],
            providers: [
                tasksService.getProviders(),
                projectService.getProviders(),
                configurationService.getProviders()
            ],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SingleTaskExtendedComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
