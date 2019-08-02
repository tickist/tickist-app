import {Task} from './tasks/tasks';
import {Project} from './projects';

export class Filter {
    id: number;
    label: string;
    name: string;
    value: string | Array<string | number>;
    avatar?: string;
    order?: string;
    fixed?: boolean;
    sortKeys?: Array<string>;
    icon?: string;

    constructor(object) {
        this.id = object.id;
        this.label = object.label;
        this.name = object.name;
        this.value = object.value;
        this.avatar = object.avatar;
        this.order = object.order;
        this.fixed = object.fixed;
        this.sortKeys = object.sortKeys;
        this.icon = object.icon;
    }

    changeValue(value): void {
        this.value = value;
    }
}
