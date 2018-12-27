import {TestBed, ComponentFixture, async} from '@angular/core/testing';
import {MockProjectService} from '../testing/mocks/project-service';
import {MockConfigurationService} from '../testing/mocks/configurationService';
import {TickistMaterialModule} from '../material.module';

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NavBarLandingPageComponent} from './nav-bar-landing-page.component';

let comp: NavBarLandingPageComponent;
let fixture: ComponentFixture<NavBarLandingPageComponent>;


describe('Component: NavBarLandingPage', () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule],
            declarations: [NavBarLandingPageComponent],
            providers: [
                projectService.getProviders(),
                configurationService.getProviders()
            ],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(NavBarLandingPageComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
