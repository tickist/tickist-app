import * as faker from 'faker';
import {ISimpleProjectApi} from '../../../models/simple-project-api.inferface';
import {IProjectApi} from '../../../models/project-api.interface';
import {ISimpleUserApi} from '../../../models/simple-user-api.interface';
import {ITagApi} from '../../../models/tag-api.interface';
import * as _ from 'lodash';
import {IUserApi} from '../../../models/user-api.interface';
import {UsersApiMockFactory} from './users-api-mock.factory';

export class ProjectsApiMockFactory {
    id = 0;

    static createSimpleProjectFromProject(project: IProjectApi): ISimpleProjectApi {
        return {
            id: project.id,
            name: project.name,
            color: project.color,
            dialog_time_when_task_finished: project.dialog_time_when_task_finished,
            share_with: []
        };
    }

    constructor() {}

    createProjectsDict(shareWith: ISimpleUserApi[], owner: IUserApi, tags: ITagApi[], howMuch: number = 17) {
        return _.range(0, howMuch).map(() => this.createProjectDict(
            shareWith,
            UsersApiMockFactory.createSimpleUserFromUser(owner),
            tags)
        );
    }

    createProjectDict(shareWith: ISimpleUserApi[], owner: ISimpleUserApi, tags: ITagApi[]): IProjectApi {
        this.id += 1;
        return {
            ancestor: null,
            color: '#2c86ff',
            creation_date: '2014-08-07T20:41:56.777000+02:00',
            default_finish_date: 0,
            default_priority: 'B',
            default_type_finish_date: 1,
            description: faker.lorem.lines(3),
            dialog_time_when_task_finished: false,
            get_all_descendants: [this.id],
            id: this.id,
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
