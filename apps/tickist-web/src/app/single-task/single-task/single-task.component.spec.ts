import {TestBed, ComponentFixture, async} from '@angular/core/testing';

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {SingleTaskComponent} from './single-task.component';
import {MockProjectService} from '../../testing/mocks/project-service';
import {MockConfigurationService} from '../../testing/mocks/configurationService';
import {TickistMaterialModule} from '../../material.module';
import {MockTaskService} from '../../testing/mocks/task-service';

let comp: SingleTaskComponent;
let fixture: ComponentFixture<SingleTaskComponent>;


describe('Component: SingleTask', () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const taskService = new MockTaskService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule],
            declarations: [SingleTaskComponent],
            providers: [
                projectService.getProviders(),
                taskService.getProviders(),
                configurationService.getProviders()
            ],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(SingleTaskComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
