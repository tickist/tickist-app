import {AvatarSize} from './avatarSize';


describe('Pipe: AvatarSize', () => {
    const pipe = new AvatarSize();
    it('AvatarSize should return proper avatar size', () => {
        const avatarPath = pipe.transform('test.png', '64x64');
        expect(avatarPath).toEqual('test_64x64.png');
    });
});
