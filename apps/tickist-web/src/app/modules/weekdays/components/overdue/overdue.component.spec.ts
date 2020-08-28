import {TestBed, ComponentFixture, async} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {OverdueComponent} from './overdue.component';
import {MockProjectService} from '../../../../testing/mocks/project-service';
import {MockConfigurationService} from '../../../../testing/mocks/configurationService';
import {TickistMaterialModule} from '../../../../material.module';
import {MockTaskService} from '../../../../testing/mocks/task-service';
import {MockUserService} from '../../../../testing/mocks/userService';
import {StoreModule} from '@ngrx/store';

let comp: OverdueComponent;
let fixture: ComponentFixture<OverdueComponent>;


describe('Component: Overdue', () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const userService = new MockUserService();
        const configurationService = new MockConfigurationService();
        const taskService = new MockTaskService();

        TestBed.configureTestingModule({
            imports: [
                TickistMaterialModule,
                StoreModule.forRoot({})
            ],
            declarations: [OverdueComponent],
            providers: [
                projectService.getProviders(),
                userService.getProviders(),
                configurationService.getProviders(),
                taskService.getProviders()
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(OverdueComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
