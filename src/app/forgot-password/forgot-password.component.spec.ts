import {TestBed, ComponentFixture, async} from '@angular/core/testing';
import {MockProjectService} from '../testing/mocks/project-service';
import {MockConfigurationService} from '../testing/mocks/configurationService';
import {TickistMaterialModule} from '../material.module';
import {ForgotPasswordComponent} from './forgot-password.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';

let comp: ForgotPasswordComponent;
let fixture: ComponentFixture<ForgotPasswordComponent>;


describe('Component: ForgotPassword', () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule],
            declarations: [ForgotPasswordComponent],
            providers: [
                projectService.getProviders(),
                configurationService.getProviders()
            ],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(ForgotPasswordComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
