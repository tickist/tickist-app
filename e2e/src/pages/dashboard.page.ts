import {browser, by, element} from 'protractor';
import {TasksPage} from './tasks.page';
import {MenuPage} from './menu.page';

export class DashboardPage {
    menuPage: MenuPage;
    static getParagraphText() {
        return element(by.css('span')).getText();
    }

    constructor() {
        this.menuPage = new MenuPage();

    }


    navigateTo() {
        return browser.get('/');
    }
}
