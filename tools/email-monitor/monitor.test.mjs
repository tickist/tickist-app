import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAccount,
  quotaIssues,
  internalRequestAllowed,
  alertMessage,
} from '../../supabase/functions/_shared/email-monitor.ts';
import {
  readEmailQuota,
  publishEmailAlert,
} from '../../supabase/functions/_shared/email-monitor-aws.ts';

const account = (sent = 0, max = 100) => ({
  SendingEnabled: true,
  ProductionAccessEnabled: true,
  SendQuota: { SentLast24Hours: sent, Max24HourSend: max, MaxSendRate: 1 },
});
const sample = (sent) => parseAccount(account(sent), 'eu-north-1');
test('80%, 95% and actual exhaustion include SMTP/API totals from AWS', () => {
  assert.deepEqual(quotaIssues(sample(79), 100), []);
  assert.deepEqual(quotaIssues(sample(80), 100), ['usage_warning']);
  assert.deepEqual(quotaIssues(sample(95), 100), [
    'usage_warning',
    'usage_critical',
  ]);
  assert.deepEqual(quotaIssues(sample(100), 100), [
    'usage_warning',
    'usage_critical',
    'quota_exhausted',
  ]);
});
test('uses the lower actual quota and never treats the target as enforced by AWS', () => {
  assert.deepEqual(
    quotaIssues(parseAccount(account(40, 50), 'eu-north-1'), 100),
    ['usage_warning', 'quota_mismatch']
  );
  assert.deepEqual(
    quotaIssues(parseAccount(account(100, 50000), 'eu-north-1'), 100),
    ['usage_warning', 'usage_critical', 'quota_mismatch']
  );
});
test('invalid/missing AWS readings are errors rather than reassuring zero usage', () => {
  for (const value of [
    null,
    {},
    account(NaN),
    account(-1),
    { ...account(), SendingEnabled: 'true' },
  ]) {
    assert.throws(() => parseAccount(value, 'eu-north-1'));
  }
});
test('worker accepts only POST with the internal header, not a user token or body secret', () => {
  const req = (method, headers = {}) =>
    new Request('https://example.invalid/monitor', { method, headers });
  assert.equal(
    internalRequestAllowed(
      req('POST', { 'x-internal-function-secret': 'test-only' }),
      'test-only'
    ),
    true
  );
  assert.equal(
    internalRequestAllowed(
      req('GET', { 'x-internal-function-secret': 'test-only' }),
      'test-only'
    ),
    false
  );
  assert.equal(
    internalRequestAllowed(
      req('POST', { authorization: 'Bearer test-only' }),
      'test-only'
    ),
    false
  );
  assert.equal(internalRequestAllowed(req('POST'), ''), false);
});
test('SNS request uses its independent endpoint and a single configured standard topic', async () => {
  const original = globalThis.fetch;
  const credentials = {
    accessKeyId: 'TEST_ONLY',
    secretAccessKey: 'test-only-not-a-real-key',
    region: 'eu-north-1',
    sessionToken: 'test-token',
  };
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response('<PublishResponse/>', { status: 200 });
  };
  try {
    await publishEmailAlert(
      credentials,
      'arn:aws:sns:eu-north-1:000000000000:tickist-test',
      alertMessage('usage_critical', sample(95), 100)
    );
    assert.equal(calls[0].url, 'https://sns.eu-north-1.amazonaws.com/');
    const body = new URLSearchParams(calls[0].init.body);
    assert.equal(body.get('Action'), 'Publish');
    assert.equal(body.has('PhoneNumber'), false);
    assert.match(
      calls[0].init.headers.authorization,
      /eu-north-1\/sns\/aws4_request/
    );
    assert.equal(calls[0].init.headers['x-amz-security-token'], 'test-token');
    assert.equal(calls[0].init.redirect, 'error');
    await assert.rejects(
      publishEmailAlert(
        credentials,
        'arn:aws:sns:us-east-1:000000000000:test',
        'test'
      )
    );
    await assert.rejects(
      publishEmailAlert(
        credentials,
        'arn:aws:sns:eu-north-1:000000000000:test.fifo',
        'test'
      )
    );
    assert.equal(calls.length, 1);
  } finally {
    globalThis.fetch = original;
  }
});
test('SES reads only aggregate quota data and failed requests expose no AWS response body', async () => {
  const original = globalThis.fetch;
  const credentials = {
    accessKeyId: 'TEST_ONLY',
    secretAccessKey: 'test-only',
    region: 'eu-north-1',
  };
  globalThis.fetch = async (url, init) => {
    assert.equal(
      url,
      'https://email.eu-north-1.amazonaws.com/v2/email/account'
    );
    assert.equal(init.method, 'GET');
    assert.equal(init.body, undefined);
    return Response.json({
      ...account(81),
      Details: { private: 'not-for-panel' },
    });
  };
  try {
    const result = await readEmailQuota(credentials);
    assert.equal(result.sent_last_24h, 81);
    assert.equal('Details' in result, false);
    globalThis.fetch = async () =>
      new Response('sensitive-debug-data', { status: 403 });
    await assert.rejects(readEmailQuota(credentials), {
      message: 'ses_unavailable',
    });
  } finally {
    globalThis.fetch = original;
  }
});
