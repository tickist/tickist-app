import {IconProp} from '@fortawesome/fontawesome-svg-core';
import {ProjectType} from "@data";

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
    projectType: ProjectType;
}

export class ProjectLeftPanel {
    id: string;
    name: string;
    ancestor: string;
    color: string;
    projectType: ProjectType;
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
