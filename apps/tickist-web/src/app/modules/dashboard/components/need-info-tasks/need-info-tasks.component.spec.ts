import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NeedInfoTasksComponent } from './need-info-tasks.component';

describe('NeedInfoTasksComponent', () => {
  let component: NeedInfoTasksComponent;
  let fixture: ComponentFixture<NeedInfoTasksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NeedInfoTasksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NeedInfoTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
