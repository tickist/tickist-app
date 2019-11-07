import {Project} from './project';

export class ProjectWithLevel extends Project {
    level: number;

    constructor(kwargs: any) {
        super(kwargs);
    }

}
