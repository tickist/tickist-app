import { Project } from "./project";

export class ProjectWithAllDescendants extends Project {
    allDescendants: string[];
    constructor(kwargs: any) {
        super(kwargs);
        Object.assign(this, kwargs);
    }
}
