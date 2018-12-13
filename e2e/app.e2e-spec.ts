import {TickistDashboard} from './app.po';

describe('tickist App', function () {
    let page: TickistDashboard;

    beforeEach(() => {
        page = new TickistDashboard();
    });

    it('should display message saying app works', () => {
        page.navigateTo();
        // expect(page.getParagraphText()).toEqual('app works!');
    });
});
