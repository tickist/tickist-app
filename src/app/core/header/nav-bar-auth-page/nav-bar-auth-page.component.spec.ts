import {TestBed, ComponentFixture, async} from '@angular/core/testing';
import {MockProjectService} from '../../../testing/mocks/project-service';
import {MockConfigurationService} from '../../../testing/mocks/configurationService';
import {TickistMaterialModule} from '../../../material.module';

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NavBarAuthPageComponent} from './nav-bar-auth-page.component';

let comp: NavBarAuthPageComponent;
let fixture: ComponentFixture<NavBarAuthPageComponent>;


describe('Component: NavBarLandingPage', () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule],
            declarations: [NavBarAuthPageComponent],
            providers: [
                projectService.getProviders(),
                configurationService.getProviders()
            ],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(NavBarAuthPageComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
