import { format } from 'date-fns'

interface ITag {
    id?: string;
    name: string;
    author: string;
    creationDate?: Date;
    modificationDate?: Date;
}


export class Tag {
    id: string;
    name: string;
    author: string;
    creationDate: Date;
    modificationDate?: Date;

    constructor(kwargs: ITag) {
        Object.assign(this, kwargs);
        this.modificationDate = new Date();
        if (!this.creationDate) {
            this.creationDate = new Date();
        }
    }
}
