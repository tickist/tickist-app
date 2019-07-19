export class SortBy {
    id: number;
    label: string;
    sortKeys: string[];
    order: Array<boolean | 'asc' | 'desc'>;
    name: string;
    icon: string;

    constructor({id, label, sortKeys, order, name, icon}) {
        this.id = id;
        this.label = label;
        this.sortKeys = sortKeys;
        this.order = order;
        this.name = name;
        this.icon = icon;
    }

}
