import {$$, by, element} from 'protractor';

export class TasksPage {
    findTaskByTaskName(taskName: string) {

    }

    getListOfTasks() {
        return element.all(by.tagName('tickist-single-task'));
    }
}
