import {SpyObject} from '../test.helpers';
import {TagsFiltersService} from '../../core/services/tags-filters.service';



export class MockTagsFiltersService extends SpyObject {
    currentTagsFilters$: any;


    constructor() {
        super(MockTagsFiltersService);

    }

    getProviders(): Array<any> {
        return [{provide: TagsFiltersService, useValue: this}];
    }
}
