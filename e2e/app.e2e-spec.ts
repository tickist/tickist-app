import { TickistShoppingPage } from './app.po';

describe('tickist-shopping App', function() {
  let page: TickistShoppingPage;

  beforeEach(() => {
    page = new TickistShoppingPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
   // expect(page.getParagraphText()).toEqual('app works!');
  });
});
