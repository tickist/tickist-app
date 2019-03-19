import { reducer, initialProjectsState } from './projects.reducer';

describe('Projects Reducer', () => {
  describe('an unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as any;

      const result = reducer(initialProjectsState, action);

      expect(result).toBe(initialProjectsState);
    });
  });
});
