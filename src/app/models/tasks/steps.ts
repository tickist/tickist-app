
interface IStep {
    id: string;
    name: string;
    status: number;
    order?: number;
    delete?: boolean;
    taskId?: string ;
}

export class Step  {
    id: string;
    name: string;
    status = 0;
    order: number;
    delete = false;
    taskId: string;


    constructor(step: IStep) {
        this.id = step.id;
        this.name = step.name;
        this.status = step.status;
        this.order = step.order;
        this.delete = step.delete;
        this.taskId = step.taskId;

    }
}
