import {Api} from '../commons';
import {PendingUser} from '../../user/models';
import {SimpleUser} from '../../user/models';
import {ISimpleProjectApi} from '../simple-project-api.inferface';


export class SimpleProject extends Api {
    id: number;
    name: string;
    color: string;
    dialogTimeWhenTaskFinished: boolean;
    shareWith: (SimpleUser | PendingUser)[] = [];

    constructor(project) {
        super();
        this.id = project.id;
        this.name = project.name;
        this.color = project.color;
        this.dialogTimeWhenTaskFinished = project.dialog_time_when_task_finished;
        if (project.hasOwnProperty('share_with')) {
            project.share_with.forEach((user) => {
                this.addUserToShareList(user);
            });
        }

    }

    toApi(): ISimpleProjectApi {
        return (<ISimpleProjectApi>super.toApi());
    }

    addUserToShareList(user) {
        if (user.hasOwnProperty('id')) {
            this.shareWith.push(new SimpleUser(user));
        } else {
            this.shareWith.push(new PendingUser(user));
        }
    }
}


