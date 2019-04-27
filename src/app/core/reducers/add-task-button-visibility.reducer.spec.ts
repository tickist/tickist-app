import {reducer, addTaskButtonInitialState} from './add-task-button-visibility.reducer';

describe('AddTaskButtonVisibility Reducer', () => {
    describe('an unknown action', () => {
        it('should return the previous state', () => {
            const action = {} as any;

            const result = reducer(addTaskButtonInitialState, action);

            expect(result).toBe(addTaskButtonInitialState);
        });
    });
});
