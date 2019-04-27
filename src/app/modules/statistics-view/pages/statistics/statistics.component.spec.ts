import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {StatisticsComponent} from './statistics.component';
import {MockComponent} from 'ng-mocks';
import {DayStatisticsComponent} from '../../components/day-statistics/day-statistics.component';
import {GlobalStatisticsComponent} from '../../components/global-statistics/global-statistics.component';


describe('StatisticsComponent', () => {
    let component: StatisticsComponent;
    let fixture: ComponentFixture<StatisticsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                StatisticsComponent,
                MockComponent(DayStatisticsComponent),
                MockComponent(GlobalStatisticsComponent)]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(StatisticsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
