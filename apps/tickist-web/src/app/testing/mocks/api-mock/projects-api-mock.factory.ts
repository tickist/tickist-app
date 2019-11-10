import * as faker from 'faker';
import * as _ from 'lodash';
import {UsersApiMockFactory} from './users-api-mock.factory';

import {Project} from '@data/projects';

export class ProjectsApiMockFactory {
    id = 0;

    static createSimpleProjectFromProject(project: any): any {
        return {
            id: project.id,
            name: project.name,
            color: project.color,
            dialog_time_when_task_finished: project.dialog_time_when_task_finished,
            share_with: []
        };
    }

    constructor() {}

    createProjectsDict(shareWith: any[], owner: any, tags: any[], howMuch: number = 17) {
        return _.range(0, howMuch).map(() => this.createProjectDict(
            shareWith,
            UsersApiMockFactory.createSimpleUserFromUser(owner),
            tags)
        );
    }

    createProjectDict(shareWith: any[], owner: any, tags: any[]): any {
        this.id += 1;
        return {
            ancestor: null,
            color: '#2c86ff',
            default_finish_date: 0,
            default_priority: 'B',
            default_type_finish_date: 1,
            description: faker.lorem.lines(3),
            dialog_time_when_task_finished: false,
            get_all_descendants: [this.id],
            id: this.id.toString(),
            is_active: true,
            is_inbox: false,
            level: 0,
            lists: [],
            logo: 'http://app.tickist.com/media/images/default_images/default_list_logo.png',
            modification_date: '2018-06-12T22:40:45.401777+02:00',
            name: faker.lorem.words(),
            owner: owner.id,
            share_with: shareWith,
            tags: tags,
            task_finish_date: '07-12-2018',
            task_view: 'extended',
            tasks_counter: 0,
            default_task_view: 'extended'
        };
    }


}
