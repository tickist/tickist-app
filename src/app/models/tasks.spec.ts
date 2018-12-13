import {Task} from './tasks';
import * as moment from 'moment';
import * as _ from 'lodash';
import {SimpleProject} from './projects/simple-project';
import {task1} from '../testing/mocks/api_mocks/tasks';
import {Step} from './steps';

let task1JSON;

describe('Task model', () => {

    beforeEach(() => {
        task1JSON = Object.assign({}, task1);
    });

    afterEach(() => {
        task1JSON = null;
    });


    it('should create simple task model', () => {
        const task = new Task(task1JSON);
        expect(task.name).toBe(task1JSON.name);
        expect(task.description).toBe(task1JSON.description);
        expect(task.id).toBe(task1JSON.id);
        expect(task.pinned).toBe(task1JSON.pinned);
        expect(task.status).toBe(task1JSON.status);
        expect(task.typeFinishDate).toBe(task1JSON.type_finish_date);
        expect(task.percent).toBe(task1JSON.percent);
        expect(task.priority).toBe(task1JSON.priority);
        expect(task.repeat).toBe(task1JSON.repeat);
        expect(task.fromRepeating).toBe(task1JSON.from_repeating);
        expect(task.repeatDelta).toBe(task1JSON.repeat_delta);
        expect(task.isActive).toBe(task1JSON.is_active);
    });

    it('should create a task model with correct finish date', () => {
        const task = new Task(task1JSON);
        expect(task.finishDate).toEqual(moment(task1JSON.finish_date, 'DD-MM-YYYY'));
    });

    it('should create a task model with blank finish date', () => {
        task1JSON.finish_date = '';
        const task = new Task(task1JSON);
        expect(task.finishDate).toBe('');
    });

    it('should create a task model with correct project model', () => {
        const task = new Task(task1JSON);
        expect(task.taskProject).toEqual(new SimpleProject(task1JSON.task_project));
    });

    it('should create a task model with all steps', () => {
        const task = new Task(task1JSON);
        expect(task.steps.length).toBe(3);
        expect(_.first(task.steps)).toEqual(new Step(task1JSON.steps[0]));
    });

    it('should create a task model with hyperlinks in task name', () => {
        const task = new Task(task1JSON);

    });

    it('should create a task model with hyperlinks in task description (domain without www)', () => {

    });

    it('should create a task model with hyperlinks in task description (domain with www)', () => {

    });

});
