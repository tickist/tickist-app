import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NextActionTasksComponent } from './next-action-tasks.component';

describe('NextActionTasksComponent', () => {
  let component: NextActionTasksComponent;
  let fixture: ComponentFixture<NextActionTasksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NextActionTasksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NextActionTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
