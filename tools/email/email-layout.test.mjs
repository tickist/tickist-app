import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  APP_URL,
  emailButton,
  renderOutboxEmail,
} from '../../supabase/functions/_shared/email-layout.ts';
import {
  AUTH_TEMPLATES,
  renderAuthTemplate,
  templatesDir,
} from './auth-templates.mjs';

test('outbox fragments get the shared layout and text footer', () => {
  const email = renderOutboxEmail({
    subject: 'Tickist reminder: Plan',
    html: `<p>Hi Ann,</p>${emailButton('Open task', `${APP_URL}/app/tasks`)}`,
    text: 'Hi Ann,',
    type: 'task_reminder',
  });

  assert.match(email.html, /^<!doctype html>/);
  assert.match(email.html, /<title>Tickist reminder: Plan<\/title>/);
  assert.match(email.html, /<p>Hi Ann,<\/p>/);
  assert.match(email.html, /href="https:\/\/tickist.com\/app\/settings"/);
  assert.match(email.text, /^Hi Ann,\n\n--\nTickist/);
});

test('plain-text outbox messages become escaped paragraphs with an action', () => {
  const email = renderOutboxEmail({
    subject: 'Task resumed: <b>x</b>',
    html: null,
    text: 'Your task "<b>x</b>" is active again in Tickist.',
    type: 'task_resumed',
  });

  assert.match(
    email.html,
    /<p>Your task &quot;&lt;b&gt;x&lt;\/b&gt;&quot; is active again in Tickist.<\/p>/
  );
  assert.match(
    email.html,
    /<title>Task resumed: &lt;b&gt;x&lt;\/b&gt;<\/title>/
  );
  assert.match(email.html, />Open Tickist<\/a><\/td>/);
});

test('a full document is sent unchanged', () => {
  const html = '<!doctype html><html><body>Ready</body></html>';

  assert.deepEqual(
    renderOutboxEmail({ subject: 's', html, text: 't', type: 'x' }),
    { html, text: 't' }
  );
});

test('Auth templates keep the Supabase placeholders and match the generated files', async () => {
  for (const template of AUTH_TEMPLATES) {
    const rendered = renderAuthTemplate(template);
    const placeholder =
      template.name === 'reauthentication'
        ? '{{ .Token }}'
        : '{{ .ConfirmationURL }}';

    assert.ok(rendered.includes(placeholder), template.name);
    assert.equal(
      await readFile(path.join(templatesDir, `${template.name}.html`), 'utf8'),
      rendered,
      `${template.name}.html is out of date; run npm run email:templates`
    );
  }
});
