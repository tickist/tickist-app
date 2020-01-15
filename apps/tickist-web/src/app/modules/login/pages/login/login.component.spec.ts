import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MockConfigurationService} from '../../../../testing/mocks/configurationService';
import {TickistMaterialModule} from '../../../../material.module';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {LoginComponent} from './login.component';
import {MockUserService} from '../../../../testing/mocks/userService';
import {AuthService} from '../../../../core/services/auth.service';
import {StoreModule} from '@ngrx/store';
import {RouterTestingModule} from '@angular/router/testing';

let comp: LoginComponent;
let fixture: ComponentFixture<LoginComponent>;

class AuthServiceMock {}

describe('Component: Login', () => {
    beforeEach(async(() => {
        const userService = new MockUserService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, RouterTestingModule, StoreModule.forRoot({})],
            declarations: [LoginComponent],
            providers: [
                userService.getProviders(),
                configurationService.getProviders(),
                {provide: AuthService, useValue: AuthServiceMock}
            ],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(LoginComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
