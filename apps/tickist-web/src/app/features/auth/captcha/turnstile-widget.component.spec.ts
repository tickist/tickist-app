import { afterEach, describe, expect, it, vi } from 'vitest';
import { CaptchaState, turnstileSiteKey } from './turnstile-widget.component';

describe('CaptchaState', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not require a check without a site key', () => {
    vi.stubGlobal('__env', { NG_APP_TURNSTILE_SITE_KEY: '' });

    const captcha = new CaptchaState();

    expect(turnstileSiteKey()).toBeNull();
    expect(captcha.required).toBe(false);
    expect(captcha.ready()).toBe(true);
  });

  it('waits for a token when a site key is configured', () => {
    vi.stubGlobal('__env', { NG_APP_TURNSTILE_SITE_KEY: 'site-key' });

    const captcha = new CaptchaState();

    expect(captcha.required).toBe(true);
    expect(captcha.ready()).toBe(false);

    captcha.token.set('token');
    expect(captcha.ready()).toBe(true);

    captcha.token.set(null);
    expect(captcha.ready()).toBe(false);
  });
});
