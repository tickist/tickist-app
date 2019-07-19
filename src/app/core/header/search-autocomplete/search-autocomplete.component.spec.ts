import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {SearchAutocompleteComponent} from './search-autocomplete.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TickistMaterialModule} from '../../../material.module';
import {MockTasksFiltersService} from '../../../testing/mocks/tasks-filters-service';
import {MockTaskService} from '../../../testing/mocks/task-service';
import {RouterModule} from '@angular/router';
import {APP_BASE_HREF} from '@angular/common';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {StoreModule} from '@ngrx/store';
import {RouterTestingModule} from '@angular/router/testing';

describe('SearchAutocompleteComponent', () => {
    let component: SearchAutocompleteComponent;
    let fixture: ComponentFixture<SearchAutocompleteComponent>;

    beforeEach(async(() => {
        const tasksFiltersService = new MockTasksFiltersService();
        const tasksService = new MockTaskService();
        TestBed.configureTestingModule({
            imports: [
                FormsModule,
                ReactiveFormsModule,
                TickistMaterialModule,
                RouterTestingModule,
                NoopAnimationsModule,
                StoreModule.forRoot({})
            ],
            declarations: [SearchAutocompleteComponent],
            providers: [
                tasksFiltersService.getProviders(),
                tasksService.getProviders()
            ],
            schemas: [NO_ERRORS_SCHEMA]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchAutocompleteComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
