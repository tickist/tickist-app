import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTaskTreeViewComponent } from './add-task-tree-view.component';

describe('AddTaskTreeViewComponent', () => {
  let component: AddTaskTreeViewComponent;
  let fixture: ComponentFixture<AddTaskTreeViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddTaskTreeViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTaskTreeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
