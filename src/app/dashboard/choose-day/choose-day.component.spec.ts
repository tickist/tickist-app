import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ChooseDayComponent} from './choose-day.component';
import {TickistMaterialModule} from '../../material.module';
import {MockConfigurationService} from '../../testing/mocks/configurationService';
import {ReactiveFormsModule} from '@angular/forms';
import {APP_BASE_HREF} from '@angular/common';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';


describe('ChooseDayComponent', () => {
    let component: ChooseDayComponent;
    let fixture: ComponentFixture<ChooseDayComponent>;

    beforeEach(async(() => {
        const configurationService = new MockConfigurationService();
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, ReactiveFormsModule, NoopAnimationsModule],
            declarations: [ChooseDayComponent],
             providers: [
                configurationService.getProviders(),
                {provide: APP_BASE_HREF, useValue: '/'}
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ChooseDayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
