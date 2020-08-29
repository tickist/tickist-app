import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectWithoutNextActionTasksComponent } from './project-without-next-action-tasks.component';

describe('ProjectWithoutNextActionTasksComponent', () => {
  let component: ProjectWithoutNextActionTasksComponent;
  let fixture: ComponentFixture<ProjectWithoutNextActionTasksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectWithoutNextActionTasksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectWithoutNextActionTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
