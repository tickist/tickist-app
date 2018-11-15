import {TruncatePipe} from './truncate.pipe';


describe('Pipe: truncate', () => {
  const pipe = new TruncatePipe();
  it('TruncatePipe should truncate a text', () => {
    expect(pipe.transform('This text is long', '5')).toBe('This ...');
    expect(pipe.transform('This text is short', '100')).toBe('This text is short');
    expect(pipe.transform('This text is short', '9', '#')).toBe('This text#');
    expect(pipe.transform(undefined, [])).toBe(undefined);
    expect(pipe.transform(null, [])).toBe(null);
  });
});
