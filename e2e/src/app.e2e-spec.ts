import {LoginPage, TickistDashboard} from './app.po';
import {browser, by, element, $$, ExpectedConditions} from 'protractor';
import {TickistStorage} from './helpers';



describe('Dashboard', function () {
    let page: TickistDashboard;

    beforeEach(async () => {
        page = new TickistDashboard();
        await page.navigateTo();
        TickistStorage.setDummyUserData();

    });

afterEach(() => {
    TickistStorage.clearStorage();
});

    it('should check weekdays list members', async () => {
        await page.navigateTo();
        const myElement = element(by.tagName('tickist-weekdays-list'));
        const isPresent = await myElement.isPresent();
        expect(isPresent).toBeTruthy();
        const daysList = await myElement.all(by.tagName('mat-list-item'));
        const today = daysList[0];
        expect(await today.element(by.tagName('span')).getText()).toEqual('today');
        const tomorrow = daysList[1];
        expect(await tomorrow.element(by.tagName('span')).getText()).toEqual('tomorrow');
        expect(daysList.length).toBe(7);
    });

    it('should check future list members', async () => {
        await page.navigateTo();
        const myElement = element(by.tagName('tickist-future-list'));
        const isPresent = await myElement.isPresent();
        expect(isPresent).toBeTruthy();
        const futureList = await myElement.all(by.tagName('mat-list-item'));
        expect(futureList.length).toBe(13);
        
    });
});



describe('Login Page', () => {
    let page: LoginPage;
    beforeEach(() => {
        page = new LoginPage;
    });

    afterEach(() => {
        TickistStorage.clearStorage();
    });

    it('should log in using proper username and password', async () => {
        await page.navigateTo();
        await page.setEmailValue('bill@tickist.com');
        await page.setPasswordValue('pass');
        await page.submit();
        await expect(
            browser.wait(
                ExpectedConditions.urlContains('home'), 5000
            ).catch(() => false )
        ).toBeTruthy(`Url match could not succced`);
    });
});
