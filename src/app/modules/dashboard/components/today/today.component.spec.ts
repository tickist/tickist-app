import {TestBed, ComponentFixture, async} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TodayComponent} from './today.component';
import {MockProjectService} from '../../../../testing/mocks/project-service';
import {MockConfigurationService} from '../../../../testing/mocks/configurationService';
import {TickistMaterialModule} from '../../../../material.module';
import {TickistSharedModule} from '../../../../shared/shared.module';
import {MockUserService} from '../../../../testing/mocks/userService';

let comp: TodayComponent;
let fixture: ComponentFixture<TodayComponent>;


describe('Component: Today', () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const userService = new MockUserService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, TickistSharedModule],
            declarations: [TodayComponent],
            providers: [
                projectService.getProviders(),
                userService.getProviders(),
                configurationService.getProviders()
            ],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(TodayComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
