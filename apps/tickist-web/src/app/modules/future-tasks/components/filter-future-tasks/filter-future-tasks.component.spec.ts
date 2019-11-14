import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {FilterFutureTasksComponent} from './filter-future-tasks.component';
import {RouterModule} from '@angular/router';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TickistMaterialModule} from '../../../../material.module';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {StoreModule} from '@ngrx/store';
import {FormsModule} from '@angular/forms';
import {MockFutureTasksFiltersService} from '../../../../testing/mocks/future-tasks-fiters-service';
import {APP_BASE_HREF} from '@angular/common';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';

describe('FilterFutureTasksComponent', () => {
    let component: FilterFutureTasksComponent;
    let fixture: ComponentFixture<FilterFutureTasksComponent>;
    const futureTaskFiltersService = new MockFutureTasksFiltersService();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                FormsModule,
                FlexLayoutModule,
                TickistMaterialModule,
                NoopAnimationsModule,
                StoreModule.forRoot({}),
                FontAwesomeModule
            ],
            declarations: [FilterFutureTasksComponent],
            providers: [
                futureTaskFiltersService.getProviders()
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FilterFutureTasksComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
