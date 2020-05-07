import {IconProp} from '@fortawesome/fontawesome-svg-core';

export interface IProjectLeftPanel {
    id: string;
    name: string;
    color: string;
    tasksCounter: number;
    ancestor: string;
    shareWith: any;
    shareWithIds: any;
    level: number;
    owner: string;
    icon: IconProp;
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
    icon: IconProp;
    owner: string;

    constructor(kwargs: IProjectLeftPanel ) {
        Object.assign(this, kwargs);
    }
}
