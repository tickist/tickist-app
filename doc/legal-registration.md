# Registration and legal documents

Migration `0026_legal_registration.sql` adds a public release catalog and a private acceptance record. It contains no published documents. Unfinished legal preparation remains in the separate management repository; application builds never read that repository.

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

The existing isolated E2E reset setup seeds a clearly labeled `e2e-fixture-v1` release only after successful reset of a local stack, using a server-side test key. It rejects remote API hosts and a nonempty release catalog. E2E fixtures are not deployable legal sources. Running the ordinary E2E suite still requires the existing database isolation/reset authorization.
