import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {FilterTagsDialogComponent} from './filter-tags-dialog.component';
import {TickistMaterialModule} from '../../../../../../material.module';
import {FormsModule} from '@angular/forms';
import {MatDialogRef} from '@angular/material';
import {MockTagsFiltersService} from '../../../../../../testing/mocks/tags-filters-service';
import {StoreModule} from '@ngrx/store';


describe('FilterTagsDialogComponent', () => {
    let component: FilterTagsDialogComponent;
    let fixture: ComponentFixture<FilterTagsDialogComponent>;
    const tagsFiltersService = new MockTagsFiltersService();
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, FormsModule, StoreModule.forRoot({})],
            declarations: [FilterTagsDialogComponent],
            providers: [
                 [{provide : MatDialogRef, useValue : {}},
                 tagsFiltersService.getProviders()]
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FilterTagsDialogComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
