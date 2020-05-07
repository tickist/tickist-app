import {DEFAULT_PROJECT_ICON} from '@data/projects';
import {IconProp} from '@fortawesome/fontawesome-svg-core';

interface ITaskProject {
    id: string;
    name: string;
    color: string;
    icon: IconProp;
    shareWithIds: string[];

}

export class TaskProject {
    id: string;
    name: string;
    color: string;
    shareWithIds: string[];
    icon = DEFAULT_PROJECT_ICON;

    constructor(kwargs: ITaskProject) {
        Object.assign(this, kwargs);
    }

}
