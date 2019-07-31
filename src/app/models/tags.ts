import moment from 'moment';


export class Tag {
    id: string;
    name: string;
    author: string;
    creationDate: string;
    modificationDate: string;
    tasksCounter: number;


    constructor({ id = null, name, author, tasksCounter = 0, creationDate = moment().format(), modificationDate = moment().format()}) {
        this.name = name;
        this.id = id;
        this.author = author;
        this.tasksCounter = tasksCounter || 0;
        this.creationDate = creationDate;
        this.modificationDate = modificationDate;

    }
}
