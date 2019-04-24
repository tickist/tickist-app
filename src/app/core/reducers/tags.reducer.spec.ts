import { reducer, initialTagsState } from './tags.reducer';

describe('Tags Reducer', () => {
  describe('an unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as any;

      const result = reducer(initialTagsState, action);

      expect(result).toBe(initialTagsState);
    });
  });
});
