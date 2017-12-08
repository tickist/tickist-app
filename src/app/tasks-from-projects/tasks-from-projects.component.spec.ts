import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TasksFromProjectsComponent } from './tasks-from-projects.component';

describe('TasksFromProjectsComponent', () => {
  let component: TasksFromProjectsComponent;
  let fixture: ComponentFixture<TasksFromProjectsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TasksFromProjectsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TasksFromProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
