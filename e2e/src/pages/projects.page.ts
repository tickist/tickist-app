import {browser} from 'protractor';


export class ProjectsPage {

    navigateTo() {
        return browser.get('/#/home/(projects//leftSideNav:projects)');
    }
}
