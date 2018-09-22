import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterFutureTasksComponent } from './filter-future-tasks.component';

describe('FilterFutureTasksComponent', () => {
  let component: FilterFutureTasksComponent;
  let fixture: ComponentFixture<FilterFutureTasksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FilterFutureTasksComponent ]
    })
    .compileComponents();
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
