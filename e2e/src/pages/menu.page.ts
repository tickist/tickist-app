import {by, element, ElementFinder} from 'protractor';

export class MenuPage {
    nav: ElementFinder;
    constructor() {
        this.nav = element(by.tagName('tickist-nav'));
    }

    async clickOnDashboard() {
        await this.nav.element(by.className('fa-home menu_icon')).click();
    }

    async clickOnProjects() {
        await this.nav.element(by.className('fa-folder menu_icon')).click();
    }
}
