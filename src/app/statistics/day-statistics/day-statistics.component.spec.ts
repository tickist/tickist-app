import {TestBed, ComponentFixture, async} from '@angular/core/testing';
import {MockProjectService} from '../../testing/mocks/project-service';
import {MockConfigurationService} from '../../testing/mocks/configurationService';
import {TickistMaterialModule} from '../../material.module';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {DayStatisticsComponent} from './day-statistics.component';
import {TickistSharedModule} from '../../shared/shared.module';
import {MockStatisticsService} from '../../testing/mocks/statisticsService';

let comp: DayStatisticsComponent;
let fixture: ComponentFixture<DayStatisticsComponent>;


describe('Component: Day statistics', () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const statisticsService = new MockStatisticsService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, TickistSharedModule],
            declarations: [DayStatisticsComponent],
            providers: [
                projectService.getProviders(),
                statisticsService.getProviders(),
                configurationService.getProviders()
            ],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(DayStatisticsComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
