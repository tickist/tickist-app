import {PendingUser} from '../../core/models';
import {SimpleUser} from '../../core/models';


export class SimpleProject  {
    id: number;
    name: string;
    color: string;
    dialogTimeWhenTaskFinished: boolean;
    shareWith: (SimpleUser | PendingUser)[] = [];

    constructor(project) {
        this.id = project.id;
        this.name = project.name;
        this.color = project.color;
        this.dialogTimeWhenTaskFinished = project.dialog_time_when_task_finished;
        if (project.hasOwnProperty('share_with')) {
            project.share_with.forEach((user) => {
                if (user.hasOwnProperty('id')) {
                    this.shareWith.push(new SimpleUser(user));
                } else {
                    this.shareWith.push(new PendingUser(user));
                }
            });
        }

    }
}


