import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeFinishDateDialogComponent } from './change-finish-date-dialog.component';

describe('ChangeFinishDateDialogComponent', () => {
  let component: ChangeFinishDateDialogComponent;
  let fixture: ComponentFixture<ChangeFinishDateDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangeFinishDateDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeFinishDateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
