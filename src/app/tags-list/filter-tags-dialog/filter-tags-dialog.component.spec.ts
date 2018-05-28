import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterTagsDialogComponent } from './filter-tags-dialog.component';

describe('FilterTagsDialogComponent', () => {
  let component: FilterTagsDialogComponent;
  let fixture: ComponentFixture<FilterTagsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FilterTagsDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterTagsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
