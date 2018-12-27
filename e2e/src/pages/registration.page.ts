import {browser, by, element} from 'protractor';

export class RegistrationPage {

    navigateTo() {
        return browser.get('/#/signup');
    }

    setEmailValue(value: string) {
        return element(by.name('email')).sendKeys(value);
    }

    setPasswordValue(value) {
        return element(by.name('password')).sendKeys(value);
    }

    setUsernameValue(value) {
        return element(by.name('username')).sendKeys(value);
    }

    submit() {
        return element(by.id('submit-button')).click();
    }
}
