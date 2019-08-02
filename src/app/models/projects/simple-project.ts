import {ShareWithUser} from './share-with-user';
import {ShareWithPendingUser} from './share-with-pending-user';


export class SimpleProject  {
    id: string;
    name: string;
    color: string;
    dialogTimeWhenTaskFinished: boolean;
    shareWith: (ShareWithUser | ShareWithPendingUser)[] = [];

    constructor(project) {
        this.id = project.id;
        this.name = project.name;
        this.color = project.color;
        this.dialogTimeWhenTaskFinished = project.dialog_time_when_task_finished;
        if (project.hasOwnProperty('share_with')) {
            project.share_with.forEach((user) => {
                if (user.hasOwnProperty('id')) {
                    this.shareWith.push(new ShareWithUser(user));
                } else {
                    this.shareWith.push(new ShareWithPendingUser(user));
                }
            });
        }

    }
}


