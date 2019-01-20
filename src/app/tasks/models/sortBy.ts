export class SortBy {
    id: number;
    label: string;
    sortKeys: string[];
    order: Array<boolean | 'asc' | 'desc'>;
    name: string;

    constructor({id, label, sortKeys, order, name}) {
        this.id = id;
        this.label = label;
        this.sortKeys = sortKeys;
        this.order = order;
        this.name = name;
    }

}
