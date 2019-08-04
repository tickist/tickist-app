// @TODO add mandatory fields

interface ITaskProject {
    id: string;
    name: string;
    color: string;

}

export class TaskProject {
    id: string;
    name: string;
    color: string;

    constructor(kwargs: ITaskProject) {
        Object.assign(this, kwargs);
    }

}
