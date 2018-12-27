import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleTaskExtendedComponent } from './single-task-extended.component';

describe('SingleTaskExtendedComponent', () => {
  let component: SingleTaskExtendedComponent;
  let fixture: ComponentFixture<SingleTaskExtendedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SingleTaskExtendedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SingleTaskExtendedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
