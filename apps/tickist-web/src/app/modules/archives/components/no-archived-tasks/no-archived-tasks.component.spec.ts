import { ComponentFixture, TestBed } from '@angular/core/testing';
import {NoArchivedTasksComponent} from "./no-archived-tasks.component";


describe('NoTasksComponent', () => {
  let component: NoArchivedTasksComponent;
  let fixture: ComponentFixture<NoArchivedTasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NoArchivedTasksComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoArchivedTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
