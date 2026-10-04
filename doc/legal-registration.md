# Registration and legal documents

Migration `0026_legal_registration.sql` adds a public release catalog and a private acceptance record. It contains no published documents. Migration `0027_publish_legal_release.sql` publishes the repository-owned Polish release `2026-09-30.1` from `docs/legal/2026-09-30.1/`, using the migration execution time as its publication date. Unfinished legal preparation remains in the separate management repository; application builds never read that repository.

## User flow

Before signup, the form loads the current published release and links to `/legal/terms/{version}` and `/legal/privacy/{version}`. These public pages require no account, sanitize Markdown through Angular, and allow downloading the exact text with its version and publication date. `/legal/terms` and `/legal/privacy` load the current release. Legal pages are excluded from indexing and the sitemap.

The terms checkbox starts unchecked and is required. The privacy link provides information; it is not a bundled consent to marketing or necessary account processing. If no final release is available or loading fails, the new signup form disables registration. Existing account login is unaffected.

Signup supplies `legal_version` and `terms_accepted` to Supabase Auth. A database trigger validates the current published version and records the user UUID, version and server timestamp in `legal_acceptances`. Client timestamps and subsequent metadata edits cannot change this evidence. Each user can read only their own record; clients cannot write it. Account hard deletion cascades to this record. Longer retention for legal claims would require a separately reviewed policy and implementation.

Acceptance is recorded when Auth creates the user, before email confirmation. Production must keep Confirm Email enabled; this record does not prove email delivery or confirmation. Preconfirmed operator-provisioned accounts without legal metadata are exempt and receive no invented acceptance. A locally autoconfirmed signup supplying acceptance is still validated and recorded. This feature does not require existing accounts to accept future revisions; that is a separate change-management process.

## Release procedure

**Do not deploy migration 0026 expecting registration to remain available without a final release.** Ordinary unconfirmed email signup is rejected by the database until a current published release exists, including attempts from older clients. The new frontend also disables signup when it cannot load a release. Apply the migration and approved release together as part of the production rollout; existing sessions and login continue to work.

1. Resolve the legal preparation's open facts and finalize the documents. Do not publish editorial notes, placeholders, test fixtures or drafts.
2. Add approved Markdown sources to this application repository, with a unique version and actual publication date. Produce a new numbered migration inserting that exact text into `legal_releases`, with locale `pl` or `en`, and `is_current=true`. Publication is an explicit operator action, not a build side effect.
3. For a later release, turn off the old `is_current` flag and insert the new current release in the same transaction. Keep old rows: versioned links must retain the accepted text. Published text, locale, version and publication date cannot be changed or deleted.
4. Deploy the database and frontend through the normal production pipeline. Check anonymous access, versioned downloads, current links, unchecked acceptance, a rejected stale version, and confirmation email/account activation using a dedicated test account.

A single release currently supplies one language for both documents. Publishing separate translations or scheduling future effective dates requires an explicit extension; do not present this as a completed PL/EN publication system. A future-dated release is invisible to clients and cannot be accepted before its publication time.

## Verification

Focused Vitest coverage lives beside the signup and legal components and in `tests/worker.spec.ts`. Run them through `nx test tickist-web --run --testFiles=...`.

`tools/legal/registration.integration.sql` creates synthetic fixtures inside a transaction and rolls everything back. Run only against local Supabase with `ON_ERROR_STOP=1`; apply migration 0026 in that same transaction if it is not installed. Tests cover missing/stale acceptance, the server timestamp, own-record RLS, hidden future releases, immutable text, operator provisioning and account deletion. Never reset a non-isolated database for this test.

The existing isolated E2E reset setup seeds a clearly labeled `e2e-fixture-v1` release only after successful reset of a local stack, using a server-side test key. It rejects remote API hosts and unexpected existing releases; after an isolated reset it deselects the known deployment release and seeds the synthetic current release. It preserves the deployment text. E2E fixtures are not deployable legal sources. Running the ordinary E2E suite still requires the existing database isolation/reset authorization.

## Current release and analytics

Run `node tools/legal/release.mjs --check` to compare the Markdown sources byte-for-byte with migrations 0027 (2026-09-30.1) and 0028 (2026-09-30.2). The check runs in CI and before production deployment. `--write` skips reviewed releases; add a new prepared release to generate a future migration. Never rewrite reviewed or deployed migrations. The new release adds separate Google Analytics disclosures without altering the previous sources or migration. Release 2026-09-30.2 was reviewed by the operator; production publication is pending. Future document changes require a new version and migration. The version identifier is not the effective date; the legal page displays the database publication timestamp.

The application offers optional Cloudflare Web Analytics on public and signed-in pages. No choice or refusal loads no beacon; allowing measurement loads it once. The public site token is supplied by `/env.js`. The browser stores the decision for 180 days, checked when the app opens. Privacy settings remain available; withdrawal reloads the page to stop an already-loaded beacon, including its listeners. A cross-tab storage change applies the same withdrawal. Users are warned to save unfinished edits first.

`assets.run_worker_first` routes HTML through the Worker while JavaScript/CSS bundles and images retain direct static delivery. HTML responses carry `Cache-Control: no-transform` to prevent Cloudflare's automatic beacon injection, while application consent controls manual loading. Before considering the production rollout verified, check the actual edge response and browser requests: no injected or loaded beacon before choice or after refusal; one beacon after consent; no further measurement after withdrawal and reload. Workers request/security logs remain enabled independently of analytics consent; their purpose and retention are described in the privacy policy. See [Cloudflare installation documentation](https://developers.cloudflare.com/web-analytics/get-started/).

## Separate Google Analytics consent

`GoogleAnalyticsService` requires both `NG_APP_GA4_MEASUREMENT_ID` and a published privacy release `2026-09-30.2`. It fetches that exact release before presenting the Google choice. Failed or missing legal data blocks collection; deploying the client alone does not enable Google. No script, event or cookieless ping is sent before consent. The Google decision uses its own versioned local-storage key and does not reuse Cloudflare permission.

GA4 uses the production stream `G-JWF4122K8L` at `https://tickist.com`. Enhanced measurement must stay disabled in that stream: `send_page_view: false` alone does not disable automatic browser-history page views. Email redaction is enabled as an additional safeguard. The client sends only manually selected `page_view`, `sign_up` (successful newly created identity) and `app_open` events. Route templates and static titles replace private URLs and titles; all query strings and fragments are omitted. Referrers are limited to fixed origins of allowlisted search and social platforms; unknown referrers are omitted. Google Signals, ad personalization and advertising consent remain disabled.

Consent expires after 180 days, including during an open page. Cookies are host-only, have a maximum lifetime of 180 days, and are not renewed by activity. Withdrawal sets the GA disable flag before reloading and deletes the configured host cookies. `tickist_ga=off` prevents a stale storage value from restarting collection; `tickist_ga=expired` displays a new choice after expiry. Operational Worker logs and the independent Cloudflare choice are unaffected.

Before deployment, review `docs/legal/2026-09-30.2/privacy.pl.md`, publish the new release through migration 0028, and deploy the application together with the runtime measurement ID. After authorized production deployment, verify no Google requests before choice or after refusal, then one tag after consent, sanitized SPA page views, withdrawal and expiry. Use a consented operator session in DebugView; never send real task text, email, IDs or tokens in test event parameters.
