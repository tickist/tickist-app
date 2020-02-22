interface IEditor {
    id: string;
    email: string;
    username: string;
}


export class Editor {
    id: string;
    email: string;
    username: string;

    constructor(props: IEditor) {
        Object.assign(this, props);
    }

}
