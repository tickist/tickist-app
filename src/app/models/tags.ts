import * as _ from 'lodash';
import {Api} from './commons';
import * as moment from 'moment';

export class Tag extends Api{
  id: number;
  name: string;
  author: number;
  creationDate: moment.Moment;
  modificationDate: moment.Moment;
  tasksCounter: number;


  constructor(tag) {
    super();
    this.name = tag.name;
    this.id = tag.id || undefined;
    this.author = tag.author;
    this.tasksCounter = tag.tasks_counter;
    this.creationDate = tag.creation_date;
    this.modificationDate = tag.modification_date;

  }
}
