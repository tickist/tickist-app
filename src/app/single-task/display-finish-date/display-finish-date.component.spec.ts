import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayFinishDateComponent } from './display-finish-date.component';

describe('DisplayFinishDateComponent', () => {
  let component: DisplayFinishDateComponent;
  let fixture: ComponentFixture<DisplayFinishDateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DisplayFinishDateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayFinishDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
