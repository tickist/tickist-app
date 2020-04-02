import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GoogleConnectComponent } from './google-connect.component';

describe('GoogleConnectComponent', () => {
  let component: GoogleConnectComponent;
  let fixture: ComponentFixture<GoogleConnectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GoogleConnectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GoogleConnectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
