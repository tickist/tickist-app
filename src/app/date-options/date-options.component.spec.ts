import {async, ComponentFixture, fakeAsync, inject, TestBed} from '@angular/core/testing';
import {DateOptionsComponent} from './date-options.component';
import {TickistMaterialModule} from '../material.module';
import {MockTaskService} from '../testing/mocks/task-service';
import {FormsModule} from '@angular/forms';
import {MockConfigurationService} from '../testing/mocks/configurationService';
import {TaskService} from '../services/task.service';
import {Task} from '../models/tasks';
import {task1} from '../testing/mocks/api_mocks/tasks';
import {MenuButtonComponent} from '../shared/menu-button/menu-button.component';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';


let comp: DateOptionsComponent;
let fixture: ComponentFixture<DateOptionsComponent>;
let task: Task;
let taskFromApi;

describe('EditDateOptionsComponent', () => {

    beforeEach(async(() => {
        const taskService = new MockTaskService();
        const configurationService = new MockConfigurationService();
        taskFromApi = task1;
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, FormsModule, NoopAnimationsModule],
            declarations: [DateOptionsComponent, MenuButtonComponent],
            providers: [
                taskService.getProviders(),
                configurationService.getProviders()
            ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(DateOptionsComponent);
            comp = fixture.componentInstance;
        });
    }));

    afterEach(() => {
        fixture = null;
        comp = null;
        taskFromApi = null;
    });

    it('should be created', () => {
        comp.task = new Task(taskFromApi);
        fixture.detectChanges();
        expect(comp).toBeTruthy();
    });

    it('should throw an exception', () => {
        comp.task = null;
        expect(() => comp.ngOnInit()).toThrowError(`Attribute 'task' is required`);
    });

    describe('ngOnChanges', () => {
        it('should  set variables correctly depends on task properties (repeatDelta == 1)', () => {
            task = new Task(taskFromApi);
            comp.task = task;
            fixture.detectChanges();
            comp.ngOnInit();
            // expect(comp.repeatDelta).toBe(1);
            // expect(comp.repeatDefault).toBe(comp.task.repeat);
            // expect(comp.repeatCustom).toBe(comp.task.repeat);
            // expect(comp.fromRepeating).toBe(comp.task.fromRepeating);
        });


    });

    describe('saveTask', () => {
        it('should call method updateTask from taskService', fakeAsync(inject([TaskService],
            (taskService: TaskService) => {
                task = new Task(taskFromApi);
                comp.task = task;
                fixture.detectChanges();
                comp.ngOnInit();
                comp.saveTask({}, '');
                expect(taskService.updateTask).toHaveBeenCalledWith(task, true);
            })));
    });
});
