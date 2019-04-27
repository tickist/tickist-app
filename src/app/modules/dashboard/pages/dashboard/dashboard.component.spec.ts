import {TestBed, ComponentFixture, async} from '@angular/core/testing';
import {MockProjectService} from '../../../../testing/mocks/project-service';
import {MockConfigurationService} from '../../../../testing/mocks/configurationService';
import {TickistMaterialModule} from '../../../../material.module';

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {DashboardComponent} from './dashboard.component';
import {MockTaskService} from '../../../../testing/mocks/task-service';
import {RouterModule} from '@angular/router';
import {APP_BASE_HREF} from '@angular/common';
import {MockUserService} from '../../../../testing/mocks/userService';
import {FlexLayoutModule} from '@angular/flex-layout';
import {StoreModule} from '@ngrx/store';

let comp: DashboardComponent;
let fixture: ComponentFixture<DashboardComponent>;


describe('Component: Dashboard', () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const userService = new MockUserService();
        const tasksService = new MockTaskService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, RouterModule.forRoot([]), FlexLayoutModule, StoreModule.forRoot({})],
            declarations: [DashboardComponent],
            providers: [
                projectService.getProviders(),
                userService.getProviders(),
                tasksService.getProviders(),
                configurationService.getProviders(),
                {provide: APP_BASE_HREF, useValue: '/'}
            ],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(DashboardComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
