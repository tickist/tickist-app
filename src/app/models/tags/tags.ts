import moment from 'moment';

interface ITag {
    id?: string;
    name: string;
    author: string;
    creationDate?: string;
    modificationDate?: string;
}


export class Tag {
    id: string;
    name: string;
    author: string;
    creationDate = moment().format();
    modificationDate = moment().format();


    constructor(kwargs: ITag) {
        Object.assign(this, kwargs);

    }
}
