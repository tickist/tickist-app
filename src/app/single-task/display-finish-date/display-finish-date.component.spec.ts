import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {DisplayFinishDateComponent} from './display-finish-date.component';
import {Task} from '../../models/tasks';
import {task1} from '../../testing/mocks/api_mocks/tasks';


describe('DisplayFinishDateComponent', () => {
    let component: DisplayFinishDateComponent;
    let fixture: ComponentFixture<DisplayFinishDateComponent>;
    let task;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DisplayFinishDateComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DisplayFinishDateComponent);
        component = fixture.componentInstance;
        task = Object.assign({}, task1);
    }));

    afterEach(() => {
        fixture = null;
        component = null;
        task = null;
    });

    it('should create', () => {
        component.task = new Task(task);
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should throw an exception', () => {
        component.task = null;
        expect(() => component.ngOnInit()).toThrowError(`Attribute 'task' is required`);
    });
});
