import { reducer, initialTeamState } from './team.reducer';

describe('Team Reducer', () => {
  describe('an unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as any;

      const result = reducer(initialTeamState, action);

      expect(result).toBe(initialTeamState);
    });
  });
});
