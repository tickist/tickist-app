export interface IProjectLeftPanel {
    id: string;
    name: string;
    color: string;
    tasksCounter: number;
    ancestor: string;
    shareWith: any;
    shareWithIds: any;
    level: number;
}

export class ProjectLeftPanel {
    id: string;
    name: string;
    ancestor: string;
    color: string;
    tasksCounter: number;
    shareWith: any;
    shareWithIds: string[];
    level: number;

    constructor(kwargs: IProjectLeftPanel ) {
        Object.assign(this, kwargs);
    }
}
