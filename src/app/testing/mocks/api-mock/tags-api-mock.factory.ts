import * as faker from 'faker';
import * as _ from 'lodash';


export class TagsApiMockFactory {
    id = 0;

    constructor(private userId: number) {

    }

    createTagsDict(howMuch: number = 10) {
        return _.range(0, howMuch).map(() => this.createTagDict());
    }

    createTagDict(): any {
        this.id += 1;
        return {
            'id': this.id,
            'name': faker.lorem.word(),
            'author': this.userId,
            'creation_date': '2018-06-19T21:05:31.034562+02:00',
            'modification_date': '2018-06-19T21:05:31.034618+02:00',
            'tasks_counter': 0
        };
    }
}
