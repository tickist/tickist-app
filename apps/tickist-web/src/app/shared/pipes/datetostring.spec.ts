import {DateToString} from './datetostring';
import {addDays, format} from 'date-fns';


describe('Pipe: DateToString', () => {
  const pipe = new DateToString();
  it('DateToString should work', () => {
    let date = new Date();
    date.setHours(0,0,0,0);
    expect(pipe.transform(format(date, 'dd-MM-yyyy'))).toBe('today');
    date = new Date();
    date.setHours(0,0,0,0);
    date = addDays(date, 1);
    expect(pipe.transform(format(date,'dd-MM-yyyy'))).toBe('tomorrow');
    date = new Date();
    date.setHours(0,0,0,0);
    date = addDays(date, -1);
    expect(pipe.transform(format(date,'dd-MM-yyyy'))).toBe('yesterday');
    date = new Date();
    date.setHours(0,0,0,0);
    date = addDays(date, 10);
    expect(pipe.transform(format(date, 'dd-MM-yyyy'))).toBe(format(date, 'EEEE'));

    expect(pipe.transform(undefined)).toBe(undefined);
    expect(pipe.transform(null)).toBe(null);
  });
});
