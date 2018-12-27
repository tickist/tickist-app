import {TestBed, ComponentFixture, async} from '@angular/core/testing';
import {MockProjectService} from '../testing/mocks/project-service';
import {MockConfigurationService} from '../testing/mocks/configurationService';
import {TickistMaterialModule} from '../material.module';

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {GlobalStatisticsComponent} from './global-statistics.component';
import {MockStatisticsService} from '../testing/mocks/statisticsService';

let comp: GlobalStatisticsComponent;
let fixture: ComponentFixture<GlobalStatisticsComponent>;


describe('Component: GlobalStatistics', () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const statisticsService = new MockStatisticsService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule],
            declarations: [GlobalStatisticsComponent],
            providers: [
                projectService.getProviders(),
                statisticsService.getProviders(),
                configurationService.getProviders()
            ],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(GlobalStatisticsComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});

