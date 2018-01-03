import {Task} from './tasks';

export class Filter {
  id: number;
  label: string;
  name: string;
  value: (task: Task) => boolean;
  avatar?: string;
  order?: string;

  constructor (object) {
    this.id = object.id;
    this.label = object.label;
    this.name = object.name;
    this.value = object.value;
    this.avatar = object.avatar;
    this.order = object.order;
  }
}
