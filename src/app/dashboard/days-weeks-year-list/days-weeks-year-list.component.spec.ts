import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DaysWeeksYearListComponent } from './days-weeks-year-list.component';

describe('DaysWeeksYearListComponent', () => {
  let component: DaysWeeksYearListComponent;
  let fixture: ComponentFixture<DaysWeeksYearListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DaysWeeksYearListComponent ]
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
