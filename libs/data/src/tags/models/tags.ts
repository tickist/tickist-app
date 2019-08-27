import { format } from 'date-fns'

interface ITag {
    id?: string;
    name: string;
    author: string;
    creationDate?: string;
}


export class Tag {
    id: string;
    name: string;
    author: string;
    creationDate: string;

    constructor(kwargs: ITag) {
        Object.assign(this, kwargs);
        this.creationDate = format(new Date(),"XXXXX")
    }
}
