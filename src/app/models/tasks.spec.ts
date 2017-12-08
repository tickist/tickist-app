import { Task, Step} from './tasks';
import { task1 } from '../testing/mocks/api_mocks/tasks';
import * as moment from 'moment';
import {Project} from './projects';
import * as _ from 'lodash';

let task1JSON;

describe('Task model', () => {

  beforeEach(() => {
     task1JSON = task1;
  });

  afterEach(() => {
    task1JSON = null;
  });


  it('should create simple task model', () => {
    const task = new Task(task1JSON);
    expect(task.name).toBe(task1.name);
    expect(task.description).toBe(task1.description);
    expect(task.id).toBe(task1.id);
    expect(task.pinned).toBe(task1.pinned);
    expect(task.status).toBe(task1.status);
    expect(task.typeFinishDate).toBe(task1.type_finish_date);
    expect(task.percent).toBe(task1.percent);
    expect(task.priority).toBe(task1.priority);
    expect(task.repeat).toBe(task1.repeat);
    expect(task.fromRepeating).toBe(task1.from_repeating);
    expect(task.repeatDelta).toBe(task1.repeat_delta);
    expect(task.estimateTime).toBe(task1.estimate_time);
    expect(task.time).toBe(task1.time);
    expect(task.isActive).toBe(task1.is_active);
  })

  it('should create a task model with correct finish date', () => {
    const task = new Task(task1JSON);
    expect(task.finishDate).toEqual(moment(task1JSON.finish_date, 'DD-MM-YYYY'))
  });

  it('should create a task model with blank finish date', () => {
    task1.finish_date = '';
    const task = new Task(task1JSON);
    expect(task.finishDate).toBe('')
  });

  it('should create a task model with correct project model', () => {
    const task = new Task(task1JSON);
    expect(task.taskProject).toEqual(new Project(task1JSON.task_project))
  });

  it('should create a task model with all steps', () => {
    const task = new Task(task1JSON);
    expect(task.steps.length).toBe(3);
    expect(_.first(task.steps)).toEqual(new Step(task1JSON.steps[0]))
  });

  it('should create a task model with hyperlinks in task name', () => {
    const task = new Task(task1JSON)

  });

  it('should create a task model with hyperlinks in task description (domain without www)', () => {

  })

  it('should create a task model with hyperlinks in task description (domain with www)', () => {

  })

});
