import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowApiErrorComponent } from './show-api-error.component';

describe('ShowApiErrorComponent', () => {
  let component: ShowApiErrorComponent;
  let fixture: ComponentFixture<ShowApiErrorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowApiErrorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowApiErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
