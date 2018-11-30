import {EditRepeatingOptionComponent} from './edit-repeating-option.component';
import {async, ComponentFixture, inject, TestBed} from '@angular/core/testing';
import {User} from '../models/user';
import {MockTaskService} from '../testing/mocks/task-service';
import {MockConfigurationService} from '../testing/mocks/configurationService';
import {TickistMaterialModule} from '../material.module';
import {FormsModule} from '@angular/forms';
import {fakeAsync} from '@angular/core/testing';
import {ConfigurationService} from '../services/configuration.service';
import {Task} from '../models/tasks';
import {TaskService} from '../services/task.service';
import { task1 } from '../testing/mocks/api_mocks/tasks';

let comp: EditRepeatingOptionComponent;
let fixture: ComponentFixture<EditRepeatingOptionComponent>;
let task: Task;
let taskFromApi;

describe('Edit repeating Component', () => {

  beforeEach(async(() => {
    const taskService = new MockTaskService();
    const configurationService = new MockConfigurationService();
    taskFromApi = task1;
    TestBed.configureTestingModule({
      imports: [TickistMaterialModule, FormsModule],
      declarations: [EditRepeatingOptionComponent],
      providers: [
        taskService.getProviders(),
        configurationService.getProviders()
      ]
    }).compileComponents().then(() => {
      fixture = TestBed.createComponent(EditRepeatingOptionComponent);
      comp = fixture.componentInstance;

    });
  }));
  afterEach(() => {
    comp = null;
    fixture = null;
    task = null;
    taskFromApi = null;
  });
  it('should create', () => {
    expect(comp).toBeTruthy();
  });
  describe('ngOnInit', () => {
    it('should set three variables', fakeAsync(inject([ConfigurationService],
      (configurationService: ConfigurationService) => {
        expect(comp.defaultRepeatOptions).toBeFalsy();
        expect(comp.customRepeatOptions).toBeFalsy();
        expect(comp.fromRepetingOptions).toBeFalsy();
        task = new Task(taskFromApi);
        comp.task = task;
        comp.ngOnInit();
        expect(comp.defaultRepeatOptions).toBe(configurationService.loadConfiguration()['commons']['DEFAULT_REPEAT_OPTIONS'])
        expect(comp.customRepeatOptions).toBe(configurationService.loadConfiguration()['commons']['CUSTOM_REPEAT_OPTIONS'])
        expect(comp.fromRepetingOptions).toBe(configurationService.loadConfiguration()['commons']['FROM_REPEATING_OPTIONS'])

      })));

    it('should throw an exception when task is null or undefined',  () => {
      expect(() => {comp.ngOnInit()} ).toThrow(new Error('Task cannot be null'));
    })
  });


  describe('saveTask', () => {
    it('should call method updateTask from taskService', fakeAsync(inject([TaskService],
      (taskService: TaskService) => {
        task = new Task(taskFromApi);
        comp.task = task;
        comp.ngOnInit();
        comp.saveTask({}, '');
        expect(taskService.updateTask).toHaveBeenCalledWith(task, true);
      })));

    it('should update task model when the repeat default is changed (scenario 1. -> default repeat )', fakeAsync(inject([TaskService],
      (taskService: TaskService) => {
      const taskRepeat = 2;
      task = new Task(taskFromApi);
      comp.task = task;
      comp.ngOnInit();
      comp.saveTask({value: taskRepeat }, 'repeatDefault');
      expect(comp.task.repeat).toBe(taskRepeat );
      expect(comp.task.repeatDelta).toBe(1);
      expect(taskService.updateTask).toHaveBeenCalledWith(task, true);
      })));

    it('should update task model when the repeat default is changed (scenario 2. -> repeat custom)', fakeAsync(inject([TaskService],
      (taskService: TaskService) => {
      const taskRepeat = 99;
      const repeatDelta = 5;
      const repeatCustom = 4;
      task = new Task(taskFromApi);
      comp.task = task;
      comp.ngOnInit();
      comp.repeatDelta = repeatDelta;
      comp.repeatCustom = repeatCustom;
      comp.saveTask({value: taskRepeat }, 'repeatDefault');
      expect(comp.task.repeat).toBe(repeatCustom);
      expect(comp.task.repeatDelta).toBe(repeatDelta);
      expect(taskService.updateTask).toHaveBeenCalledWith(task, true);
      })));
  });


});
