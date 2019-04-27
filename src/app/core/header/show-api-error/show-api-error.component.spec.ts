import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ShowApiErrorComponent} from './show-api-error.component';
import {MockConfigurationService} from '../../../testing/mocks/configurationService';
import {APP_BASE_HREF} from '@angular/common';
import {StoreModule} from '@ngrx/store';

describe('ShowApiErrorComponent', () => {
    let component: ShowApiErrorComponent;
    let fixture: ComponentFixture<ShowApiErrorComponent>;
    const configurationService = new MockConfigurationService();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({})],
            declarations: [ShowApiErrorComponent],
            providers: [
                configurationService.getProviders(),
                {provide: APP_BASE_HREF, useValue: '/'}
            ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(ShowApiErrorComponent);
            component = fixture.componentInstance;
        });
    }));


    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
