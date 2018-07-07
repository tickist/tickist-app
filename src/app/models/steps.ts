import {Api} from './commons';


export class Step extends Api {
    id: number;
    name: string;
    status: number;
    order: number;
    delete: boolean;
    taskId: number;


    constructor(step) {
        super();
        this.id = step.id;
        this.name = step.name;
        this.status = step.status;
        this.order = step.order;
        this.delete = step.delete;
        this.taskId = step.task;

    }
}
