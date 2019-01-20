import {SimpleUser} from '../../user/models';
import {PendingUser} from '../../user/models';
import {Api} from '../commons';
import {IProjectApi} from '../project-api.interface';
import {ISimpleUserApi} from '../simple-user-api.interface';
import {SimpleProject} from './index';
import {ISimpleProjectApi} from '../simple-project-api.inferface';
import {IUserApi} from '../user-api.interface';
import {toSnakeCase} from '../../utils/toSnakeCase';


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
    shareWith: (SimpleUser | PendingUser)[] = [];
    level: number;
    owner: number;
    defaultFinishDate: any;
    defaultPriority: any;
    defaultTypeFinishDate: any;
    dialogTimeWhenTaskFinished: boolean;
    taskView: string;

    constructor(project: IProjectApi) {
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
        this.taskView = project.task_view;
        this.dialogTimeWhenTaskFinished = project.dialog_time_when_task_finished;
        this.isInbox = project.is_inbox;
        project.share_with.forEach((user) => {
            this.addUserToShareList(user);

        });
    }

    addUserToShareList(user): void {
        if (user.hasOwnProperty('id')) {
            this.shareWith.push(new SimpleUser(user));
        } else {
            this.shareWith.push(new PendingUser(user));
        }
    }

    // toApi(): ISimpleProjectApi {
    //     return (<ISimpleProjectApi>super.toApi());
    // }

    hasDescription(): boolean {
        return this.description && this.description.length > 0;
    }

    get matOptionClass(): string {
        return `level_${this.level}`;
    }

    private convert(text: string): string {
        const exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        const exp2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        let richText;
        if (text) {
            richText = text.replace(exp, '<a target="_blank" href=\'$1\'>$1</a>')
                .replace(exp2, '$1<a target="_blank" href="http://$2">$2</a>');
        } else {
            richText = text;
        }
        return richText;
    }

    convertToSimpleProject(): SimpleProject {
        const simpleProjectApi: ISimpleProjectApi = {
            id: this.id,
            name: this.name,
            color: this.color,
            dialog_time_when_task_finished: this.dialogTimeWhenTaskFinished
        };
        return new SimpleProject(simpleProjectApi);
    }
}
