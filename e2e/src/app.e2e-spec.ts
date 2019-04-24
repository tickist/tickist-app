import {LoginPage, DashboardPage, ProjectsPage, RegistrationPage} from './pages';
import {browser, by, element, $$, ExpectedConditions} from 'protractor';
import {TickistStorage} from './helpers';



describe('Dashboard', function () {
    let page: DashboardPage;

    beforeEach(async () => {
        page = new DashboardPage();
        await page.navigateTo();
        TickistStorage.setDummyUserData();

    });

    afterEach(async () => {
        await page.navigateTo();
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

    it('should check future-tasks list members', async () => {
        await page.navigateTo();
        const myElement = element(by.tagName('tickist-future-tasks-list'));
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

    it('should log in using proper email and password', async () => {
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


describe('Registration Page', () => {
    let page: RegistrationPage;
    beforeEach(() => {
        page = new RegistrationPage;
    });

    afterEach(() => {
        TickistStorage.clearStorage();
    });

    it('should sign up using email and password', async () => {
        await page.navigateTo();
        await page.setEmailValue('bill@tickist.com');
        await page.setPasswordValue('pass');
        await page.setUsernameValue('pass');
        await page.submit();
        await expect(
            browser.wait(
                ExpectedConditions.urlContains('home'), 5000
            ).catch(() => false )
        ).toBeTruthy(`Url match could not succced`);
    });
});


describe('Tasks list', () => {
    let projects: ProjectsPage;
    let dashboard: DashboardPage;

    beforeEach(async () => {
        projects = new ProjectsPage();
        dashboard = new DashboardPage();
        await dashboard.navigateTo();
        TickistStorage.setDummyUserData();
        await dashboard.navigateTo();
    });

    it('should click on pin icon and add task to today\'s task list', async () => {
        await expect(element(by.tagName('tickist-today')).element(by.className('pinned')).isPresent()).toBeFalsy();
        await dashboard.menuPage.clickOnProjects();
        const listOfTasks = await projects.tasksPage.getListOfTasks();
        const task = listOfTasks[0];
        await browser.actions().mouseMove(task.element(by.tagName('tickist-right-menu'))).perform();
        await task.element(by.tagName('tickist-pin-button')).click();
        await projects.menuPage.clickOnDashboard();
        await expect(element(by.tagName('tickist-today')).element(by.className('pinned')).isPresent()).toBeTruthy();
    });
});
