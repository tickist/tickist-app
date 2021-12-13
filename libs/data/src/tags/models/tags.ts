import { format } from "date-fns";

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
        if (!this.creationDate) {
            this.creationDate = new Date();
        }
        if (!this.modificationDate) {
            this.modificationDate = new Date();
        }
    }
}
