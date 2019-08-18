import {DateToString} from './datetostring';


describe('Pipe: DateToString', () => {
  const pipe = new DateToString();
  it('DateToString should work', () => {
    let date = moment().hours(0).minutes(0).seconds(0);
    expect(pipe.transform(date.format('DD-MM-YYYY'))).toBe('today');
    date = moment().hours(0).minutes(0).seconds(0).add(1, 'days');
    expect(pipe.transform(date.format('DD-MM-YYYY'))).toBe('tomorrow');
    date = moment().hours(0).minutes(0).seconds(0).add(-1, 'days');
    expect(pipe.transform(date.format('DD-MM-YYYY'))).toBe('yesterday');
    date = moment().hours(0).minutes(0).seconds(0).add(10, 'days');
    expect(pipe.transform(date.format('DD-MM-YYYY'))).toBe(date.format('dddd'));

    expect(pipe.transform(undefined)).toBe(undefined);
    expect(pipe.transform(null)).toBe(null);
  });
});
