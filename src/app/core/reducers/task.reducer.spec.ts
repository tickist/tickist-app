import { reducer, initialTasksState } from './task.reducer';

describe('Task Reducer', () => {
  describe('an unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as any;

      const result = reducer(initialTasksState, action);

      expect(result).toBe(initialTasksState);
    });
  });
});
