import {UsersApiMockFactory} from './users-api-mock.factory';
import {ProjectsApiMockFactory} from './projects-api-mock.factory';
import * as faker from 'faker';
import {IProjectApi} from '../../../../../../../libs/data/src/lib/project-api.interface';
import * as _ from 'lodash';
import moment from 'moment';
import {Menu} from '../../../../../../../libs/data/src/lib/menu';
import {Tag} from '../../../../../../../libs/data/src/lib/tags/models/tags';

export class TasksApiMockFactory {
    id = 0;

    static createResponseFromServer(task: any) {
        if (task.steps instanceof Object) {
            task.steps = [];
        }
        return task;
    }

    constructor() {

    }

    createTasksDict(owner: any, author: any, project: IProjectApi, tags: Tag[], howMuch: number = 17) {
        return _.range(0, howMuch).map(() => this.createTaskDict(owner, author, project, tags));
    }



    createTaskDict(owner: any, author: any, project: IProjectApi, tags: Tag[]): any {
        this.id += 1;

        return {
            author: UsersApiMockFactory.createSimpleUserFromUser(author),
            creation_date: faker.date.past().toISOString(),
            description: faker.lorem.lines(3),
            estimate_time: 0,
            finish_date:  '',
            finish_date_dateformat: '',
            finish_time: null,
            from_repeating: 0,
            id: this.id,
            is_active: true,
            modification_date: faker.date.past().toISOString(),
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
            tags: <any> tags,
            task_list_pk: project.id.toString(),
            task_project: ProjectsApiMockFactory.createSimpleProjectFromProject(project),
            time: 0,
            type_finish_date: 0,
            when_complete: null,
            menu_showing: new Menu({})
        };
    }
}
