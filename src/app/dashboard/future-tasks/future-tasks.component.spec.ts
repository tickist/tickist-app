import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FutureTasksComponent } from './future-tasks.component';

describe('FutureTasksComponent', () => {
  let component: FutureTasksComponent;
  let fixture: ComponentFixture<FutureTasksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FutureTasksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FutureTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
