import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FutureListComponent } from './future-list.component';

describe('FutureListComponent', () => {
  let component: FutureListComponent;
  let fixture: ComponentFixture<FutureListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FutureListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FutureListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
