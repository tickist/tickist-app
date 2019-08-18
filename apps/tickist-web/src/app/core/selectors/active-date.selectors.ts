import {createFeatureSelector, createSelector} from '@ngrx/store';
import {ActiveDateState} from '../reducers/active-date.reducer';
import {stateActiveDateElement} from '@data/state-active-date-element.enum';
import {parse, setHours, setMilliseconds, setMinutes, setSeconds} from 'date-fns';


export const selectActiveDateState = createFeatureSelector<ActiveDateState>('activeDate');


export const selectActiveDate = createSelector(
    selectActiveDateState,
    activeDateState => {
        let date: Date;
        if (activeDateState.active.state === stateActiveDateElement.future) {
            date = parse(`01-${activeDateState.active.date}`, 'dd-LLLL-uuuu', new Date());
        } else if (activeDateState.active.state === stateActiveDateElement.weekdays) {
            const splittedDate: string[] = activeDateState.active.date.split('-');
            date = new Date(parseInt(splittedDate[2], 10), parseInt(splittedDate[1], 10) - 1, parseInt(splittedDate[0], 10));
            date = setMinutes(date, 0);
            date = setHours(date, 0);
            date = setSeconds(date, 0);
            date = setMilliseconds(date, 0);
        }
        return {
            date: date,
            state: activeDateState.active.state
        };
    }
);


// updateActiveDateElement(date?: string) {
//     let toStore: moment.Moment;
//     let state: stateActiveDateElement;
//     if (!date) {
//         date = moment().format('DD-MM-YYYY');
//     }
//     const splittedDate: string[] = date.split('-');
//     if (splittedDate.length === 2) {
//         toStore = moment().month(splittedDate[0]).year(parseInt(splittedDate[1], 10)).date(1);
//         state = stateActiveDateElement.future;
//     } else if (date.split('-').length === 3) {
//         toStore = moment()
//             .month(parseInt(splittedDate[1], 10) - 1)
//             .year(parseInt(splittedDate[2], 10))
//             .date(parseInt(splittedDate[0], 10));
//         state = stateActiveDateElement.weekdays;
//     }
//     this.store.dispatch(new configurationAction.UpdateActiveDateElement({
//         date: toStore.set({hour: 0, minute: 0, second: 0, millisecond: 0}),
//         state: state
//     }));
// }
