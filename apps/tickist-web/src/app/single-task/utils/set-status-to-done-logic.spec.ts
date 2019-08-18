import {Task} from '../../../../../../libs/data/src/lib/tasks/models/tasks';
import {setStatusDoneLogic} from './set-status-to-done-logic';
import {Step} from '../../../../../../libs/data/src/lib/tasks/models/steps';
import moment from 'moment';
import 'jest';

describe('setStatusDoneLogic', () => {
    describe('task without repeating options', () => {
        it('should return task with done status', () => {
            const task: Partial<Task> = {
                'name': 'Task',
                'isDone': false,
                'steps': []
            };
            const newTask = setStatusDoneLogic(task);
            expect(newTask.isDone).toBe(true);
            expect(newTask.name).toBe('Task');
            expect(task.isDone).toBe(false);
        });

        it('should return task with done status (task has steps)', () => {
            const task: Partial<Task> = {
                'name': 'Task',
                'isDone': false,
                'steps': [
                    {name: 'step 1', status: 0},
                    {name: 'step 2', status: 0},
                ] as Partial<Step[]>
            };
            const newTask = setStatusDoneLogic(task);
            expect(newTask.isDone).toBe(true);
            expect(newTask.name).toBe('Task');
            expect(task.isDone).toBe(false);
            expect(newTask.steps.filter(step => step.status === 0)).toEqual([]);
            expect(task.steps.filter(step => step.status === 0)).not.toEqual([]);
        });
    });

    describe('task with repeating options', () => {
        let date;
        beforeEach(() => {
            date = new Date();
            date = date.setMilliseconds(0);
        });

        it('should return task with status undone', () => {
            const task: Partial<Task> = {
                'name': 'Task',
                'isDone': false,
                'repeat': 1,
                'repeatDelta': 1,
                'steps': []
            };
            const newTask = setStatusDoneLogic(task);
            expect(task.isDone).toBe(false);
            expect(newTask.isDone).toBe(false);
        });

        it('should return task with status undone (All steps should be undone)', () => {
            const task: Partial<Task> = {
                'name': 'Task',
                'isDone': false,
                'repeat': 1,
                'repeatDelta': 1,
                'steps': [
                    {name: 'step 1', status: 1},
                    {name: 'step 2', status: 1},
                    {name: 'step 3', status: 0},
                ] as Partial<Step[]>
            };
            const newTask = setStatusDoneLogic(task);
            expect(task.isDone).toBe(false);
            expect(newTask.isDone).toBe(false);
            expect(newTask.steps.filter(step => step.status === 1)).toEqual([]);
        });

        it('should return task with status undone and finishDate=tomorrow()', () => {
            const task: Partial<Task> = {
                'name': 'Task',
                'isDone': false,
                'repeat': 1,
                'repeatDelta': 1,
                'fromRepeating': 0,
                'finishDate': moment(date),
                'steps': []
            };
            const newTask = setStatusDoneLogic(task);
            expect(newTask.isDone).toBe(false);
            expect(newTask.finishDate.format('DD-MM-YYYY')).toEqual(moment(date).add(1, 'd').format('DD-MM-YYYY'));
        });

        it('should return task with status undone and finishDate=+2days', () => {
            const task: Partial<Task> = {
                'name': 'Task',
                'isDone': false,
                'repeat': 1,
                'repeatDelta': 2,
                'fromRepeating': 0,
                'finishDate': moment(date),
                'steps': []
            };
            const newTask = setStatusDoneLogic(task);
            expect(newTask.isDone).toBe(false);
            expect(newTask.finishDate.format('DD-MM-YYYY')).toEqual(moment(date).add(2, 'd').format('DD-MM-YYYY'));
        });

        it('should return task with status undone and finishDate=+1day (workweek)', () => {
            const friday = new Date('2019-04-19T04:41:20');
            const task: Partial<Task> = {
                'name': 'Task',
                'isDone': false,
                'repeat': 2,
                'repeatDelta': 1,
                'fromRepeating': 1,
                'finishDate': moment(friday),
                'steps': []
            };
            const newTask = setStatusDoneLogic(task);
            expect(newTask.isDone).toBe(false);
            expect(newTask.finishDate).toEqual(moment(friday).add(3, 'd'));
        });

        it('should return task with status undone and finishDate=+10days (workweek)', () => {
            const friday = new Date('2019-04-19T04:41:20');
            const task: Partial<Task> = {
                'name': 'Task',
                'isDone': false,
                'repeat': 2,
                'repeatDelta': 10,
                'fromRepeating': 1,
                'finishDate': moment(friday),
                'steps': []
            };
            const newTask = setStatusDoneLogic(task);
            expect(newTask.isDone).toBe(0);
            expect(newTask.finishDate).toEqual(moment(friday).add(14, 'd'));
        });

        it('should return task with status undone and finishDate=+1week', () => {
            const task: Partial<Task> = {
                'name': 'Task',
                'isDone': false,
                'repeat': 3,
                'repeatDelta': 1,
                'fromRepeating': 0,
                'finishDate': moment(date),
                'steps': []
            };
            const newTask = setStatusDoneLogic(task);
            expect(newTask.isDone).toBe(false);
            expect(newTask.finishDate.format('DD-MM-YYYY')).toEqual(moment(date).add(1, 'w').format('DD-MM-YYYY'));
        });

        it('should return task with status undone and finishDate=+2weeks', () => {
            const task: Partial<Task> = {
                'name': 'Task',
                'isDone': false,
                'repeat': 3,
                'repeatDelta': 2,
                'fromRepeating': 0,
                'finishDate': moment(date),
                'steps': []
            };
            const newTask = setStatusDoneLogic(task);
            expect(newTask.isDone).toBe(false);
            expect(newTask.finishDate.format('DD-MM-YYYY')).toEqual(moment(date).add(2, 'w').format('DD-MM-YYYY'));
        });

        it('should return task with status undone and finishDate=+1month', () => {
            const task: Partial<Task> = {
                'name': 'Task',
                'isDone': false,
                'repeat': 4,
                'repeatDelta': 1,
                'fromRepeating': 0,
                'finishDate': moment(date),
                'steps': []
            };
            const newTask = setStatusDoneLogic(task);
            expect(newTask.isDone).toBe(false);
            expect(newTask.finishDate.format('DD-MM-YYYY')).toEqual(moment(date).add(1, 'months').format('DD-MM-YYYY'));
        });

        it('should return task with status undone and finishDate=+2months', () => {
            const task: Partial<Task> = {
                'name': 'Task',
                'isDone': false,
                'repeat': 4,
                'repeatDelta': 2,
                'fromRepeating': 0,
                'finishDate': moment(date),
                'steps': []
            };
            const newTask = setStatusDoneLogic(task);
            expect(newTask.isDone).toBe(false);
            expect(newTask.finishDate.format('DD-MM-YYYY')).toEqual(moment(date).add(2, 'months').format('DD-MM-YYYY'));
        });

        it('should return task with status undone and finishDate=+1year', () => {
            const task: Partial<Task> = {
                'name': 'Task',
                'isDone': false,
                'repeat': 5,
                'repeatDelta': 1,
                'fromRepeating': 0,
                'finishDate': moment(date),
                'steps': []
            };
            const newTask = setStatusDoneLogic(task);
            expect(newTask.isDone).toBe(false);
            expect(newTask.finishDate.format('DD-MM-YYYY')).toEqual(moment(date).add(1, 'y').format('DD-MM-YYYY'));
        });

        it('should return task with status undone and finishDate=+2years', () => {
            const task: Partial<Task> = {
                'name': 'Task',
                'isDone': false,
                'repeat': 5,
                'repeatDelta': 2,
                'fromRepeating': 0,
                'finishDate': moment(date),
                'steps': []
            };
            const newTask = setStatusDoneLogic(task);
            expect(newTask.isDone).toBe(false);
            expect(newTask.finishDate.format('DD-MM-YYYY')).toEqual(moment(date).add(2, 'y').format('DD-MM-YYYY'));
        });

        it('should return task with status undone and finishDate=+2oldFinishDate', () => {
            const oldFinishDate = new Date('2019-03-08T04:41:20');
            const task: Partial<Task> = {
                'name': 'Task',
                'isDone': false,
                'repeat': 1,
                'repeatDelta': 2,
                'fromRepeating': 1,
                'finishDate': moment(oldFinishDate),
                'steps': []
            };
            const newTask = setStatusDoneLogic(task);
            expect(newTask.isDone).toBe(false);
            expect(newTask.finishDate).toEqual(moment(oldFinishDate).add(2, 'd'));
        });

    });
});
