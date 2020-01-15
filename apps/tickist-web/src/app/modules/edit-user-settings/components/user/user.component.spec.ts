import {TestBed, ComponentFixture, async} from '@angular/core/testing';
import {MockProjectService} from '../../../../testing/mocks/project-service';
import {MockConfigurationService} from '../../../../testing/mocks/configurationService';
import {TickistMaterialModule} from '../../../../material.module';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {UserComponent} from './user.component';
import {TickistSharedModule} from '../../../../shared/shared.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MockUserService} from '../../../../testing/mocks/userService';
import {MockLocation} from '../../../../testing/mocks/location';
import {StoreModule} from '@ngrx/store';

let comp: UserComponent;
let fixture: ComponentFixture<UserComponent>;


describe('Component: ForgotPassword', () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const userService = new MockUserService();
        const location = new MockLocation();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, TickistSharedModule, FormsModule, ReactiveFormsModule, StoreModule.forRoot({})],
            declarations: [UserComponent],
            providers: [
                projectService.getProviders(),
                userService.getProviders(),
                configurationService.getProviders(),
                location.getProviders()
            ],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(UserComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
