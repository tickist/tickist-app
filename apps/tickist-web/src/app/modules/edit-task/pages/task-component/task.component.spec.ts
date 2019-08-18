import {TestBed, ComponentFixture, async} from '@angular/core/testing';
import {MockProjectService} from '../../../../testing/mocks/project-service';
import {MockConfigurationService} from '../../../../testing/mocks/configurationService';
import {TickistMaterialModule} from '../../../../material.module';

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TaskComponent} from './task.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {APP_BASE_HREF} from '@angular/common';
import {MockTaskService} from '../../../../testing/mocks/task-service';
import {MockUserService} from '../../../../testing/mocks/userService';
import {MockTagService} from '../../../../testing/mocks/tag-service';
import {StoreModule} from '@ngrx/store';
import {RouterTestingModule} from '@angular/router/testing';

let comp: TaskComponent;
let fixture: ComponentFixture<TaskComponent>;


describe('Component: Task', () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const userService = new MockUserService();
        const tasksService = new MockTaskService();
        const tagService = new MockTagService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, FormsModule, ReactiveFormsModule, RouterTestingModule, StoreModule.forRoot({})],
            declarations: [TaskComponent],
            providers: [
                projectService.getProviders(),
                userService.getProviders(),
                tagService.getProviders(),
                tasksService.getProviders(),
                configurationService.getProviders()
            ],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(TaskComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
