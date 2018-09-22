import * as moment from 'moment';
import {stateActiveDateElement} from './state-active-date-element.enum';

export interface IActiveDateElement {
    date: moment.Moment;
    state: stateActiveDateElement;
}
