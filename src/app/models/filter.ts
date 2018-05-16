import {Task} from './tasks';
import {Project} from './projects';

export class Filter {
  id: number;
  label: string;
  name: string;
  value: (object: Task | Project) => boolean;
  avatar?: string;
  order?: string;
  fixed?: boolean;

  constructor (object) {
    this.id = object.id;
    this.label = object.label;
    this.name = object.name;
    this.value = object.value;
    this.avatar = object.avatar;
    this.order = object.order;
    this.fixed = object.fixed;
  }
}
