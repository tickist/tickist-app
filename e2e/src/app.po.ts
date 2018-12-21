import {browser, by, element} from 'protractor';


export class TickistDashboard {

    static getParagraphText() {
        return element(by.css('span')).getText();
    }

    navigateTo() {
        return browser.get('/');
    }
}

export class LoginPage {
    navigateTo() {
        return browser.get('/');
    }

    setEmailValue(value: string) {
        // await element(by.name('email')).clear();
        // console.log("1")
        return element(by.name('email')).sendKeys(value);
    }

    setPasswordValue(value) {
        return element(by.name('password')).sendKeys(value);
    }

    submit() {
        return element(by.id('submit-button')).click();
    }
}
