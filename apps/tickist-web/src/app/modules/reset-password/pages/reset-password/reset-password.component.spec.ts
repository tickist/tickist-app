import {TestBed, ComponentFixture, async} from '@angular/core/testing';
import {ResetPasswordComponent} from './reset-password.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {MockProjectService} from '../../../../testing/mocks/project-service';
import {MockConfigurationService} from '../../../../testing/mocks/configurationService';
import {TickistMaterialModule} from '../../../../material.module';

let comp: ResetPasswordComponent;
let fixture: ComponentFixture<ResetPasswordComponent>;


describe('Component: ForgotPassword', () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule],
            declarations: [ResetPasswordComponent],
            providers: [
                projectService.getProviders(),
                configurationService.getProviders()
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(ResetPasswordComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
