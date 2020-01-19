import { ChangeUserIdToUserNamePipe } from './change-user-id-to-user-name.pipe';

describe('ChangeUserIdToUserNamePipe', () => {
  it('create an instance', () => {
    const pipe = new ChangeUserIdToUserNamePipe();
    expect(pipe).toBeTruthy();
  });
});
