import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TasksTreeViewMainViewComponent } from './tasks-tree-view.component';

describe('TasksTreeViewMainViewComponent', () => {
  let component: TasksTreeViewMainViewComponent;
  let fixture: ComponentFixture<TasksTreeViewMainViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TasksTreeViewMainViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TasksTreeViewMainViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
