import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowOfflineModeComponent } from './show-offline-mode.component';

describe('ShowOfflineModeComponent', () => {
  let component: ShowOfflineModeComponent;
  let fixture: ComponentFixture<ShowOfflineModeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowOfflineModeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowOfflineModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
