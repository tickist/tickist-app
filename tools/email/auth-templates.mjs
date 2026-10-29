// Supabase Auth email templates rendered from the shared Tickist email layout.
// `npm run email:templates` writes them to supabase/templates/; local Auth reads
// them through supabase/config.toml and the production workflow pushes them to
// hosted Auth. Placeholders such as {{ .ConfirmationURL }} are Go templates
// filled in by Supabase Auth.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  emailButton,
  renderEmailLayout,
} from '../../supabase/functions/_shared/email-layout.ts';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);
export const templatesDir = path.join(root, 'supabase/templates');

const FOOTER_NOTE =
  'You received this email because this address was used with Tickist. If it was not you, you can ignore it.';

const linkFallback = (url) =>
  `<p style="font-size:13px;line-height:20px;color:#64748b;">If the button does not work, copy this link into your browser:<br><a href="${url}" style="word-break:break-all;">${url}</a></p>`;

export const AUTH_TEMPLATES = [
  {
    name: 'confirmation',
    subject: 'Confirm your Tickist account',
    preheader: 'Confirm your email address to start using Tickist.',
    body: [
      '<h1>Confirm your email</h1>',
      '<p>Thanks for signing up for Tickist. Confirm {{ .Email }} to start organising your projects, priorities and deadlines.</p>',
      emailButton('Confirm email', '{{ .ConfirmationURL }}'),
      linkFallback('{{ .ConfirmationURL }}'),
    ],
  },
  {
    name: 'recovery',
    subject: 'Reset your Tickist password',
    preheader: 'Set a new password for your Tickist account.',
    body: [
      '<h1>Reset your password</h1>',
      '<p>We received a request to reset the password for {{ .Email }}. Choose a new password with the button below.</p>',
      emailButton('Set a new password', '{{ .ConfirmationURL }}'),
      '<p>If you did not ask for this, you can ignore this email; your password stays the same.</p>',
      linkFallback('{{ .ConfirmationURL }}'),
    ],
  },
  {
    name: 'magic_link',
    subject: 'Your Tickist sign-in link',
    preheader: 'Use this link to sign in to Tickist.',
    body: [
      '<h1>Sign in to Tickist</h1>',
      '<p>Use the button below to sign in as {{ .Email }}. The link works once and expires soon.</p>',
      emailButton('Sign in', '{{ .ConfirmationURL }}'),
      linkFallback('{{ .ConfirmationURL }}'),
    ],
  },
  {
    name: 'email_change',
    subject: 'Confirm your new Tickist email address',
    preheader: 'Confirm the change of your Tickist email address.',
    body: [
      '<h1>Confirm your new email</h1>',
      '<p>Confirm changing the email address of your Tickist account from {{ .Email }} to {{ .NewEmail }}.</p>',
      emailButton('Confirm new email', '{{ .ConfirmationURL }}'),
      '<p>If you did not ask for this change, ignore this email and keep using your current address.</p>',
      linkFallback('{{ .ConfirmationURL }}'),
    ],
  },
  {
    name: 'invite',
    subject: 'You have been invited to Tickist',
    preheader: 'Accept your invitation to Tickist.',
    body: [
      '<h1>You are invited to Tickist</h1>',
      '<p>Tickist keeps projects, priorities and deadlines in one calm place. Accept the invitation to create your account.</p>',
      emailButton('Accept invitation', '{{ .ConfirmationURL }}'),
      linkFallback('{{ .ConfirmationURL }}'),
    ],
  },
  {
    name: 'reauthentication',
    subject: 'Your Tickist verification code',
    preheader: 'Your Tickist verification code.',
    body: [
      '<h1>Confirm it is you</h1>',
      '<p>Enter this code in Tickist to continue:</p>',
      '<p style="margin:20px 0;font-size:28px;line-height:36px;font-weight:700;letter-spacing:6px;color:#0f172a;">{{ .Token }}</p>',
      '<p>If you did not ask for this code, you can ignore this email.</p>',
    ],
  },
];

export function renderAuthTemplate(template) {
  return renderEmailLayout({
    subject: template.subject,
    preheader: template.preheader,
    bodyHtml: template.body.join('\n'),
    footerNote: FOOTER_NOTE,
  });
}

export function renderSubjects() {
  return `${JSON.stringify(
    Object.fromEntries(AUTH_TEMPLATES.map((t) => [t.name, t.subject])),
    null,
    2
  )}\n`;
}

async function main() {
  const check = process.argv.includes('--check');
  const outputs = [
    ...AUTH_TEMPLATES.map((t) => [`${t.name}.html`, renderAuthTemplate(t)]),
    ['subjects.json', renderSubjects()],
  ];
  const stale = [];

  for (const [file, content] of outputs) {
    const target = path.join(templatesDir, file);

    if (check) {
      const current = await readFile(target, 'utf8').catch(() => null);
      if (current !== content) stale.push(file);
    } else {
      await writeFile(target, content);
    }
  }

  if (stale.length) {
    console.error(
      `Auth email templates are out of date: ${stale.join(
        ', '
      )}. Run npm run email:templates.`
    );
    process.exit(1);
  }

  console.log(
    check
      ? 'Auth email templates are up to date.'
      : 'Auth email templates written.'
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
