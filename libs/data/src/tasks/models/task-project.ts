interface ITaskProject {
    id: string;
    name: string;
    color: string;
    shareWithIds: string[];

}

export class TaskProject {
    id: string;
    name: string;
    color: string;
    shareWithIds: string[];

    constructor(kwargs: ITaskProject) {
        Object.assign(this, kwargs);
    }

}
