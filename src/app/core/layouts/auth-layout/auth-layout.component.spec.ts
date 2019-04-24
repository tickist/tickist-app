import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogLayoutComponent } from './auth-layout.component';

describe('DialogLayoutComponent', () => {
  let component: DialogLayoutComponent;
  let fixture: ComponentFixture<DialogLayoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogLayoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
