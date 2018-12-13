import {UsersApiMockFactory} from './users-api-mock.factory';
import {ProjectsApiMockFactory} from './projects-api-mock.factory';
import {ITaskApi} from '../../../models/task-api.interface';
import * as faker from 'faker'
import {ITagApi} from '../../../models/tag-api.interface';
import {IUserApi} from '../../../models/user-api.interface';
import {IProjectApi} from '../../../models/project-api.interface';
import * as _ from 'lodash';

export class TasksApiMockFactory {
    id = 0;

    constructor() {

    }

    createTasksDict(owner: IUserApi, author: IUserApi, project: IProjectApi, tags: ITagApi[], howMuch: number = 10) {
        return _.range(0, howMuch).map(() => this.createTaskDict(owner, author, project, tags));
    }

    createTaskDict(owner: IUserApi, author: IUserApi, project: IProjectApi, tags: ITagApi[]): ITaskApi {
        this.id += 1;
        return {
            author: UsersApiMockFactory.createSimpleUserFromUser(author),
            creation_date: '2018-07-04T00:49:06.119612+02:00',
            description: faker.lorem.lines(3),
            estimate_time: 0,
            finish_date: '28-02-2019',
            finish_date_dateformat: '2019-02-28',
            finish_time: null,
            from_repeating: 0,
            id: this.id,
            is_active: true,
            modification_date: '2018-10-02T21:23:39.208750+02:00',
            name: faker.lorem.words(),
            owner: UsersApiMockFactory.createSimpleUserFromUser(owner),
            owner_pk: owner.id,
            percent: 0,
            pinned: false,
            priority: 'B',
            repeat: 0,
            repeat_delta: 1,
            status: 0,
            steps: [],
            suspend_date: null,
            tags: tags,
            task_list_pk: project.id,
            task_project: ProjectsApiMockFactory.createSimpleProjectFromProject(project),
            time: 0,
            type_finish_date: 0,
            when_complete: null
        };
    }
}
