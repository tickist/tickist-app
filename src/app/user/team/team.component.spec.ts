/* tslint:disable:no-unused-variable */

import {TestBed, async, ComponentFixture} from '@angular/core/testing';
import {TeamComponent} from './team.component';
import {MockProjectService} from '../../testing/mocks/project-service';
import {MockConfigurationService} from '../../testing/mocks/configurationService';
import {AvatarSize} from '../../shared/pipes/avatarSize';
import {TickistMaterialModule} from '../../material.module';

let comp: TeamComponent;
let fixture: ComponentFixture<TeamComponent>;


describe('Component: Team', () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule],
            declarations: [TeamComponent, AvatarSize],
            providers: [
                projectService.getProviders(),
                configurationService.getProviders()
            ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(TeamComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
