import {browser, by, element} from 'protractor';

export class DashboardPage {

    static getParagraphText() {
        return element(by.css('span')).getText();
    }

    navigateTo() {
        return browser.get('/');
    }
}
