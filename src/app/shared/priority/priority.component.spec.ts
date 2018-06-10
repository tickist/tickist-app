import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PriorityComponent } from './priority.component';
import {TickistMaterialModule} from '../../material.module';

describe('PriorityComponent', () => {
  let component: PriorityComponent;
  let fixture: ComponentFixture<PriorityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
        imports: [TickistMaterialModule],
        declarations: [ PriorityComponent,  ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PriorityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
