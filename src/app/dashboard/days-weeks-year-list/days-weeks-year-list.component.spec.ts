import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {DaysWeeksYearListComponent} from './days-weeks-year-list.component';
import {TickistMaterialModule} from '../../material.module';
import {ReactiveFormsModule} from '@angular/forms';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MockComponent} from 'ng-mocks';
import {FutureListComponent} from '../future-list/future-list.component';
import {WeekDaysComponent} from '../weekdays/weekdays.component';
import {DayStatisticsComponent} from '../../statistics/day-statistics/day-statistics.component';
import {MockConfigurationService} from '../../testing/mocks/configurationService';

describe('DaysWeeksYearListComponent', () => {
    let component: DaysWeeksYearListComponent;
    let fixture: ComponentFixture<DaysWeeksYearListComponent>;

    beforeEach(async(() => {
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, ReactiveFormsModule, NoopAnimationsModule],
            declarations: [DaysWeeksYearListComponent, MockComponent(DayStatisticsComponent),
                MockComponent(FutureListComponent), MockComponent(WeekDaysComponent)],
            providers: [
                configurationService.getProviders(),
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DaysWeeksYearListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
