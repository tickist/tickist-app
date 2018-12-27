import {NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MockProjectService} from './testing/mocks/project-service';
import {MockConfigurationService} from './testing/mocks/configurationService';
import {TickistMaterialModule} from './material.module';
import {AppComponent} from './app.component';

let comp: AppComponent;
let fixture: ComponentFixture<AppComponent>;


describe('Component: ForgotPassword', () => {
    beforeEach(async(() => {

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule],
            declarations: [AppComponent],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(AppComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
