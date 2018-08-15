import {Api} from '../commons';
import {PendingUser} from '../user';
import {SimplyUser} from '../user';


export class SimpleProject extends Api {
    id: number;
    name: string;
    color: string;
    dialogTimeWhenTaskFinished: boolean;
    shareWith: (SimplyUser | PendingUser)[] = [];

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

    addUserToShareList(user) {
        if (user.hasOwnProperty('id')) {
            this.shareWith.push(new SimplyUser(user));
        } else {
            this.shareWith.push(new PendingUser(user));
        }
    }
}


