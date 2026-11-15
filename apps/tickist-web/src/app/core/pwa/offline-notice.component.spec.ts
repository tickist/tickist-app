import { TestBed } from '@angular/core/testing';

import { fixtureHost } from '../../../testing/dom';
import { OfflineNoticeComponent } from './offline-notice.component';

describe('OfflineNoticeComponent', () => {
  let online = true;

  beforeEach(() => {
    online = true;
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function render() {
    const fixture = TestBed.createComponent(OfflineNoticeComponent);

    fixture.detectChanges();
    await fixture.whenStable();

    return fixture;
  }

  it('stays empty while the browser is online', async () => {
    const fixture = await render();

    expect(
      fixtureHost(fixture).querySelector('[data-testid="offline-notice"]')
    ).toBeNull();
    expect(
      fixtureHost(fixture).querySelector('[role="status"]')
    ).not.toBeNull();
  });

  it('shows the notice when the connection drops and hides it when it returns', async () => {
    const fixture = await render();

    online = false;
    window.dispatchEvent(new Event('offline'));
    fixture.detectChanges();

    const notice = fixtureHost(fixture).querySelector(
      '[data-testid="offline-notice"]'
    );

    expect(notice?.textContent).toContain("You're offline");

    online = true;
    window.dispatchEvent(new Event('online'));
    fixture.detectChanges();

    expect(
      fixtureHost(fixture).querySelector('[data-testid="offline-notice"]')
    ).toBeNull();
  });

  it('shows the notice when the app starts offline', async () => {
    online = false;

    const fixture = await render();

    expect(
      fixtureHost(fixture).querySelector('[data-testid="offline-notice"]')
    ).not.toBeNull();
  });

  it('stops listening after it is destroyed', async () => {
    const fixture = await render();
    const remove = vi.spyOn(window, 'removeEventListener');

    fixture.destroy();

    expect(remove).toHaveBeenCalledWith('online', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
