// Shared look of every Tickist email. send-emails wraps each outbox message in
// this layout, and tools/email/build-auth-templates.mjs renders the Supabase
// Auth templates from it. Plain TypeScript without Deno APIs so Node can import
// it as well.

export const APP_URL = "https://tickist.com";

const LOGO_URL = `${APP_URL}/icons/icon-96x96.png`;
const SETTINGS_URL = `${APP_URL}/app/settings`;

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface EmailLayoutInput {
  subject: string;
  bodyHtml: string;
  preheader?: string;
  footerNote?: string;
}

export interface OutboxEmail {
  subject: string;
  html: string | null;
  text: string | null;
  type: string;
}

export const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const emailButton = (label: string, url: string): string =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">` +
  `<tr><td style="border-radius:10px;background:#4f46e5;">` +
  `<a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 24px;font-family:${FONT_STACK};font-size:15px;font-weight:600;line-height:20px;color:#ffffff;text-decoration:none;border-radius:10px;">${escapeHtml(label)}</a>` +
  `</td></tr></table>`;

// Plain-text bodies (for example task-resume emails queued by the database)
// become paragraphs; single line breaks are kept.
export const textToEmailHtml = (text: string): string =>
  text
    .trim()
    .split(/\n{2,}/)
    .filter((paragraph) => paragraph.trim().length > 0)
    .map((paragraph) =>
      `<p>${escapeHtml(paragraph.trim()).replaceAll("\n", "<br>")}</p>`
    )
    .join("\n");

export const renderEmailLayout = (input: EmailLayoutInput): string => {
  const preheader = input.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${
      escapeHtml(input.preheader)
    }</div>`
    : "";
  const footerNote = input.footerNote ??
    "You receive this email because of your Tickist notification settings.";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(input.subject)}</title>
<style>
  body { margin:0; padding:0; background:#f1f5f9; }
  .tk-body h1 { margin:0 0 16px; font-size:22px; line-height:30px; font-weight:700; color:#0f172a; }
  .tk-body h2 { margin:20px 0 12px; font-size:18px; line-height:26px; font-weight:700; color:#0f172a; }
  .tk-body p { margin:0 0 14px; }
  .tk-body ul { margin:0 0 16px; padding-left:20px; }
  .tk-body li { margin:0 0 6px; }
  .tk-body a { color:#4f46e5; }
  @media (max-width: 620px) { .tk-card { padding:24px !important; } }
</style>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
<tr><td style="padding:0 4px 20px;">
<a href="${APP_URL}" style="text-decoration:none;">
<img src="${LOGO_URL}" width="36" height="36" alt="" style="vertical-align:middle;border:0;border-radius:8px;">
<span style="vertical-align:middle;margin-left:10px;font-family:${FONT_STACK};font-size:20px;font-weight:700;color:#0f172a;">Tickist</span>
</a>
</td></tr>
<tr><td class="tk-card tk-body" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;font-family:${FONT_STACK};font-size:16px;line-height:26px;color:#334155;">
${input.bodyHtml}
</td></tr>
<tr><td style="padding:20px 4px 0;font-family:${FONT_STACK};font-size:13px;line-height:20px;color:#64748b;">
<p style="margin:0 0 8px;">${escapeHtml(footerNote)}</p>
<p style="margin:0;"><a href="${APP_URL}/app" style="color:#4f46e5;text-decoration:none;">Open Tickist</a> &middot; <a href="${SETTINGS_URL}" style="color:#4f46e5;text-decoration:none;">Email settings</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`;
};

// Call-to-action for outbox messages that arrive as plain text only.
const TEXT_ONLY_ACTIONS: Record<string, { label: string; path: string }> = {
  task_resumed: { label: "Open Tickist", path: "/app" },
};

const FOOTER_NOTES: Record<string, string> = {
  "project-invite":
    "You received this email because a Tickist user invited you to a shared project.",
};

const TEXT_FOOTER = `\n\n--\nTickist · ${APP_URL}\nEmail settings: ${SETTINGS_URL}`;

// Wraps an outbox message in the shared layout. Messages that already are a
// full document are sent unchanged.
export const renderOutboxEmail = (
  email: OutboxEmail,
): { html: string | null; text: string | null } => {
  if (email.html && /^\s*<!doctype/i.test(email.html)) {
    return { html: email.html, text: email.text };
  }

  const action = TEXT_ONLY_ACTIONS[email.type];
  const fragment = email.html ??
    (email.text
      ? textToEmailHtml(email.text) +
        (action ? emailButton(action.label, `${APP_URL}${action.path}`) : "")
      : null);

  if (!fragment) {
    return { html: null, text: email.text };
  }

  return {
    html: renderEmailLayout({
      subject: email.subject,
      bodyHtml: fragment,
      footerNote: FOOTER_NOTES[email.type],
    }),
    text: email.text ? `${email.text.trimEnd()}${TEXT_FOOTER}` : null,
  };
};
