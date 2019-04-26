import {browser} from 'protractor';
import {TasksPage} from './tasks.page';
import {MenuPage} from './menu.page';


export class ProjectsPage {
    tasksPage: TasksPage;
    menuPage: MenuPage;

    constructor() {
        this.tasksPage = new TasksPage();
        this.menuPage = new MenuPage();
    }

    navigateTo() {
        return browser.get('/#/home/(projects//leftSideNav:projects)');
    }

    navigateToProject(projectId: number) {
        return browser.get(`#/home/(projects/${projectId}//leftSideNav:projects)`);
    }
}
