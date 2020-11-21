import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskTypeLabelComponent } from './task-type-label.component';

describe('TaskTypeLabelComponent', () => {
  let component: TaskTypeLabelComponent;
  let fixture: ComponentFixture<TaskTypeLabelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaskTypeLabelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskTypeLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
