import {ISimpleUserApi} from '../../../models/simple-user-api.interface';
import * as _ from 'lodash';
import * as faker from 'faker';
import {ISimpleProjectApi} from '../../../models/simple-project-api.inferface';

export class UsersApiMockFactory {
    id = 0;

    static createSimpleUserFromUser(user: any): ISimpleUserApi {
        return {
            avatar: user.avatar,
            avatar_url: user.avatar_url,
            email: user.email,
            id: user.id,
            username: user.username,
            share_with: user.share_with
        };
    }

    constructor() {}

    createUsersDict(howMuch: number = 1) {
        return _.range(0, howMuch).map(() => this.createUserDict());
    }

    createUserDict(): any {
        this.id += 1;
        return {
            'username': faker.internet.userName(),
            'avatar': 'http://app.tickist.com/media/users/6/post.jpg',
            'id': this.id,
            'email': faker.internet.email(faker.name.firstName(), faker.name.lastName(), 'tickist.com'),
            'facebook_connection': false,
            'google_connection': false,
            'avatar_url': '/media/users/6/post.jpg',
            'inbox_pk': 1,
            'daily_summary_hour': '07:00:00',
            'date_joined': '2014-12-07',
            'removes_me_from_shared_list': true,
            'shares_list_with_me': true,
            'assigns_task_to_me': true,
            'completes_task_from_shared_list': true,
            'changes_task_from_shared_list_that_is_assigned_to_me': true,
            'changes_task_from_shared_list_that_i_assigned_to_him_her': true,
            'leaves_shared_list': true,
            'order_tasks_dashboard': 'Today->Overdue',
            'deletes_list_shared_with_me': true,
            'default_task_view_today_view': 'extended',
            'default_task_view_overdue_view': 'extended',
            'default_task_view_future_view': 'extended',
            'default_task_view_tags_view': 'extended',
            'default_task_view': 'extended',
            'overdue_tasks_sort_by': '{"fields": ["priority", "finishDate", "finishTime", "name"], "orders": ["asc", "asc", "asc", "asc"]}',
            'future_tasks_sort_by': '{"fields": ["finishDate", "finishTime", "name"], "orders": ["desc", "asc", "asc"]}',
            'all_tasks_view': 'simple',
            'projects_filter_id': 1,
            'tags_filter_id': 1,
            'dialog_time_when_task_finished_in_project': false,
            'share_with': []
        };
    }


}
