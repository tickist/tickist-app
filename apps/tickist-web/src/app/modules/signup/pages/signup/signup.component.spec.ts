import {TestBed, ComponentFixture, async} from '@angular/core/testing';
import {MockProjectService} from '../../../../testing/mocks/project-service';
import {MockConfigurationService} from '../../../../testing/mocks/configurationService';
import {TickistMaterialModule} from '../../../../material.module';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {SignupComponent} from './signup.component';
import {MockUserService} from '../../../../testing/mocks/userService';
import {RouterModule, Routes} from '@angular/router';
import {APP_BASE_HREF} from '@angular/common';
import {AuthService} from '../../../../core/services/auth.service';
import {StoreModule} from '@ngrx/store';
import {RouterTestingModule} from '@angular/router/testing';

let comp: SignupComponent;
let fixture: ComponentFixture<SignupComponent>;


class AuthServiceMock {}

describe('Component: SignUp', () => {
    beforeEach(async(() => {
        const userService = new MockUserService();

        TestBed.configureTestingModule({
            imports: [
                TickistMaterialModule, RouterTestingModule, StoreModule.forRoot({})],
            declarations: [SignupComponent],
            providers: [
                userService.getProviders(),
                {provide: AuthService, useValue: AuthServiceMock}
            ],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(SignupComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
