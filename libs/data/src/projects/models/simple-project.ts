import { ShareWithUser } from "./share-with-user";

export class SimpleProject {
    id: string;
    name: string;
    color: string;
    dialogTimeWhenTaskFinished: boolean;
    shareWith: ShareWithUser[] = [];

    constructor(project) {
        this.id = project.id;
        this.name = project.name;
        this.color = project.color;
        this.dialogTimeWhenTaskFinished =
            project.dialog_time_when_task_finished;
        if (project.share_with) {
            project.share_with.forEach((user) => {
                this.shareWith.push(new ShareWithUser(user));
            });
        }
    }
}
