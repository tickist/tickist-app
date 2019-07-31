


export class Step  {
    id: number;
    name: string;
    status: number;
    order: number;
    delete: boolean;
    taskId: number;


    constructor(step) {
        this.id = step.id;
        this.name = step.name;
        this.status = step.status;
        this.order = step.order;
        this.delete = step.delete;
        this.taskId = step.task;

    }
}
