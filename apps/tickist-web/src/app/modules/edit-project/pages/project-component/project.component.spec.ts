import {TestBed, ComponentFixture, async} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ProjectComponent} from './project.component';
import {MockProjectService} from '../../../../testing/mocks/project-service';
import {MockConfigurationService} from '../../../../testing/mocks/configurationService';
import {TickistMaterialModule} from '../../../../material.module';
import {TickistSharedModule} from '../../../../shared/shared.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MockUserService} from '../../../../testing/mocks/userService';
import {RouterModule} from '@angular/router';
import {APP_BASE_HREF} from '@angular/common';
import {StoreModule} from '@ngrx/store';
import {RouterTestingModule} from '@angular/router/testing';

let comp: ProjectComponent;
let fixture: ComponentFixture<ProjectComponent>;


describe('Component: Project', () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const userService = new MockUserService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [
                TickistMaterialModule,
                TickistSharedModule,
                FormsModule,
                ReactiveFormsModule,
                RouterTestingModule,
                StoreModule.forRoot({})
            ],
            declarations: [ProjectComponent],
            providers: [
                projectService.getProviders(),
                userService.getProviders(),
                configurationService.getProviders()
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(ProjectComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
