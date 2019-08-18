import moment from 'moment';
import {isOverdue} from './task-utils';
import { Task } from '../../models/tasks/tasks';

describe('#isOverdue', () => {
    it('should return true because task is overdue', () => {
        const task = <Partial<Task>> {
            name: 'task',
            finishDate: moment().subtract(1, 'days')
        };
        expect(isOverdue(task as Task)).toBeTruthy();
    });

    it('should return false because task is not overdue', () => {
        const task = <Partial<Task>> {
            name: 'task',
            finishDate: moment().add(1, 'days')
        };
        expect(isOverdue(task as Task)).toBeFalsy();
    });

    it('should return false because task is not overdue and finishDate is set to today', () => {
        const task = <Partial<Task>> {
            name: 'task',
            finishDate: moment().hours(23).minutes(58)
        };
        expect(isOverdue(task as Task)).toBeFalsy();
    });

    it('should return false because task is not overdue and finishDate is set to today', () => {
        const task = <Partial<Task>> {
            name: 'task',
            finishDate: moment().hours(0).minutes(1)
        };
        expect(isOverdue(task as Task)).toBeFalsy();
    });
});
