import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowNotificationAboutNewDayComponent } from './show-notification-about-new-day.component';

describe('ShowNotificationAboutNewDayComponent', () => {
  let component: ShowNotificationAboutNewDayComponent;
  let fixture: ComponentFixture<ShowNotificationAboutNewDayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowNotificationAboutNewDayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowNotificationAboutNewDayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
