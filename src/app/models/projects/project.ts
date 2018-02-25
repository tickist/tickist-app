import {SimplyUser} from '../user/simply-user';
import {PendingUser} from '../user/pending-user';
import {Api} from '../commons';


export class Project extends Api {
    id: number;
    name: string;
    isActive: boolean;
    isInbox: boolean;
    description: string;
    richDescription: string;
    ancestor: Project;
    color: string;
    tasksCounter: number;
    allDescendants: any;
    shareWith: (SimplyUser | PendingUser)[] = [];
    level: number;
    owner: number;
    defaultFinishDate: any;
    defaultPriority: any;
    defaultTypeFinishDate: any;
    dialogTimeWhenTaskFinished: boolean;
    defaultTaskView: string;
    
    constructor(project) {
        super();
        this.name = project.name;
        this.id = project.id || undefined;
        this.ancestor = project.ancestor || undefined;
        this.color = project.color || undefined;
        this.tasksCounter = !(isNaN(project.tasks_counter)) ? project.tasks_counter : undefined;
        this.allDescendants = project.get_all_descendants;
        this.description = project.description;
        this.richDescription = this.convert(project.description);
        this.defaultFinishDate = project.default_finish_date;
        this.defaultPriority = project.default_priority;
        this.defaultTypeFinishDate = project.default_type_finish_date;
        this.owner = project.owner;
        this.level = project.level;
        this.isActive = project.is_active;
        this.defaultTaskView = project.task_view || 'extended';
        this.dialogTimeWhenTaskFinished = project.dialog_time_when_task_finished;
        this.isInbox = project.is_inbox;
        if (!project.share_with) {
            debugger
        }
        project.share_with.forEach((user) => {
            this.addUserToShareList(user);
            
        });
    }
    
    addUserToShareList(user) {
        if (user.hasOwnProperty('id')) {
            this.shareWith.push(new SimplyUser(user));
        } else {
            this.shareWith.push(new PendingUser(user));
        }
    }
    
    private convert(text) {
        const exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        const exp2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        let richText;
        if (text) {
            richText = text.replace(exp, '<a target="_blank" href=\'$1\'>$1</a>').replace(exp2, '$1<a target="_blank" href="http://$2">$2</a>');
        } else {
            richText = text;
        }
        return richText;
    }
}
