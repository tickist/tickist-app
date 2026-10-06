import { parseAccount, type EmailQuotaSample } from './email-monitor.ts';

export interface MonitorCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
}

const encoder = new TextEncoder();
const hex = (value: ArrayBuffer) =>
  Array.from(new Uint8Array(value), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
const hash = async (value: string) =>
  hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
const hmac = async (key: Uint8Array, value: string): Promise<Uint8Array> => {
  const imported = await crypto.subtle.importKey(
    'raw',
    key as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return new Uint8Array(
    await crypto.subtle.sign('HMAC', imported, encoder.encode(value))
  );
};

// Endpoints are constructed here, never taken from the browser or a request body.
export async function signedMonitorRequest(
  credentials: MonitorCredentials,
  service: 'ses' | 'sns',
  method: 'GET' | 'POST',
  path: string,
  body = ''
): Promise<Response> {
  if (!/^[a-z]{2}-[a-z]+-\d$/.test(credentials.region))
    throw new Error('invalid_region');
  const host = `${service === 'ses' ? 'email' : 'sns'}.${
    credentials.region
  }.amazonaws.com`;
  const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const stamp = date.slice(0, 8);
  const headers: Record<string, string> = {
    'content-type':
      service === 'sns'
        ? 'application/x-www-form-urlencoded'
        : 'application/json',
    host,
    'x-amz-date': date,
  };
  if (credentials.sessionToken)
    headers['x-amz-security-token'] = credentials.sessionToken;
  const keys = Object.keys(headers).sort();
  const canonicalHeaders = keys
    .map((key) => `${key}:${headers[key].trim()}\n`)
    .join('');
  const canonical = [
    method,
    path,
    '',
    canonicalHeaders,
    keys.join(';'),
    await hash(body),
  ].join('\n');
  const scope = `${stamp}/${credentials.region}/${service}/aws4_request`;
  const toSign = ['AWS4-HMAC-SHA256', date, scope, await hash(canonical)].join(
    '\n'
  );
  const kDate = await hmac(
    encoder.encode('AWS4' + credentials.secretAccessKey),
    stamp
  );
  const kRegion = await hmac(kDate, credentials.region);
  const kService = await hmac(kRegion, service);
  const signing = await hmac(kService, 'aws4_request');
  const signature = Array.from(await hmac(signing, toSign), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${
    credentials.accessKeyId
  }/${scope}, SignedHeaders=${keys.join(';')}, Signature=${signature}`;
  delete headers.host;
  return fetch(`https://${host}${path}`, {
    method,
    headers,
    ...(method === 'POST' ? { body } : {}),
    signal: AbortSignal.timeout(8000),
    redirect: 'error',
  });
}

export async function readEmailQuota(
  credentials: MonitorCredentials
): Promise<EmailQuotaSample> {
  const response = await signedMonitorRequest(
    credentials,
    'ses',
    'GET',
    '/v2/email/account'
  );
  if (!response.ok) throw new Error('ses_unavailable');
  return parseAccount(await response.json(), credentials.region);
}

export async function publishEmailAlert(
  credentials: MonitorCredentials,
  topicArn: string,
  message: string
): Promise<void> {
  const arn = topicArn.match(
    /^arn:aws:sns:([a-z0-9-]+):\d{12}:([A-Za-z0-9_-]+)$/
  );
  if (!arn || arn[1] !== credentials.region)
    throw new Error('invalid_sns_topic');
  const body = new URLSearchParams({
    Action: 'Publish',
    Version: '2010-03-31',
    TopicArn: topicArn,
    Subject: 'Tickist: ostrzezenie dotyczace wysylki e-maili',
    Message: message,
  }).toString();
  const response = await signedMonitorRequest(
    credentials,
    'sns',
    'POST',
    '/',
    body
  );
  if (!response.ok) throw new Error('sns_unavailable');
}
