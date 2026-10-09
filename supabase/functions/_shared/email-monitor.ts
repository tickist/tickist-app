import { internalSecretMatches } from './timing-safe.ts';

export interface EmailQuotaSample {
  region: string;
  sent_last_24h: number;
  max_24h_send: number;
  max_send_rate: number;
  sending_enabled: boolean;
  production_access_enabled: boolean;
}

export type EmailAlertKind =
  | 'usage_warning'
  | 'usage_critical'
  | 'quota_exhausted'
  | 'sending_disabled'
  | 'monitor_unavailable'
  | 'quota_mismatch'
  | 'delivery_failure';

export function parseAccount(value: unknown, region: string): EmailQuotaSample {
  if (typeof value !== 'object' || value === null)
    throw new Error('invalid_account');
  const account = value as Record<string, unknown>;
  const quota = account.SendQuota as Record<string, unknown> | undefined;
  const numbers = [
    quota?.SentLast24Hours,
    quota?.Max24HourSend,
    quota?.MaxSendRate,
  ];
  if (
    numbers.some(
      (n) => typeof n !== 'number' || !Number.isFinite(n) || n < 0
    ) ||
    typeof account.SendingEnabled !== 'boolean' ||
    typeof account.ProductionAccessEnabled !== 'boolean'
  ) {
    throw new Error('invalid_account');
  }
  return {
    region,
    sent_last_24h: numbers[0] as number,
    max_24h_send: numbers[1] as number,
    max_send_rate: numbers[2] as number,
    sending_enabled: account.SendingEnabled,
    production_access_enabled: account.ProductionAccessEnabled,
  };
}

export function quotaIssues(
  sample: EmailQuotaSample,
  target: number
): EmailAlertKind[] {
  const effective = Math.min(target, sample.max_24h_send);
  const issues: EmailAlertKind[] = [];
  if (sample.sent_last_24h >= effective * 0.8) issues.push('usage_warning');
  if (sample.sent_last_24h >= effective * 0.95) issues.push('usage_critical');
  if (sample.sent_last_24h >= sample.max_24h_send)
    issues.push('quota_exhausted');
  if (!sample.sending_enabled) issues.push('sending_disabled');
  if (sample.max_24h_send !== target) issues.push('quota_mismatch');
  return issues;
}

export function alertMessage(
  kind: EmailAlertKind,
  sample: EmailQuotaSample | null,
  target: number
): string {
  const descriptions: Record<EmailAlertKind, string> = {
    usage_warning: 'Osiagnieto 80% progu ostrzegawczego wysylki.',
    usage_critical: 'Osiagnieto 95% progu ostrzegawczego wysylki.',
    quota_exhausted:
      'Limit SES zostal wyczerpany. Kolejne proby wysylki moga byc odrzucane.',
    sending_disabled: 'AWS SES ma wylaczona wysylke.',
    monitor_unavailable:
      'Nie mozna odczytac statystyk SES. Panel moze pokazywac nieaktualne dane.',
    quota_mismatch:
      'Rzeczywisty limit SES rozni sie od oczekiwanego limitu. Sprawdz ustawienia AWS.',
    delivery_failure:
      'Wykryto bledy wysylki powiadomien Tickist w ostatnich 15 minutach.',
  };
  return [
    'Tickist — monitoring e-maili',
    descriptions[kind],
    sample
      ? `Region: ${sample.region}\nOdbiorcy w ostatnich 24h: ${sample.sent_last_24h}\nRzeczywisty limit SES: ${sample.max_24h_send}\nLimit na sekunde: ${sample.max_send_rate}`
      : 'Brak aktualnego odczytu SES.',
    `Oczekiwany limit: ${target}/24h. Prog ostrzegawczy nie zmienia limitu AWS.`,
    'Dane SES obejmuja API i SMTP w tym regionie.',
    'Panel: https://tickist.com/app/admin/email',
  ].join('\n\n');
}

export function internalRequestAllowed(req: Request, secret: string): boolean {
  return (
    req.method === 'POST' &&
    internalSecretMatches(req.headers.get('x-internal-function-secret'), secret)
  );
}
