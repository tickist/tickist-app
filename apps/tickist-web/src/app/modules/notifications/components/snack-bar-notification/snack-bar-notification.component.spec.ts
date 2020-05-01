import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SnackBarNotificationComponent } from './snack-bar-notification.component';

describe('SnackBarNotificationComponent', () => {
  let component: SnackBarNotificationComponent;
  let fixture: ComponentFixture<SnackBarNotificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SnackBarNotificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SnackBarNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
