import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseDayComponent } from './choose-day.component';

describe('ChooseDayComponent', () => {
  let component: ChooseDayComponent;
  let fixture: ComponentFixture<ChooseDayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChooseDayComponent ]
    })
    .compileComponents();
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
