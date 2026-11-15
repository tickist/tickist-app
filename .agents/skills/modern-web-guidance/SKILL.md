---
name: modern-web-guidance
description: |
  Search curated modern web platform guidance (Chrome, Edge, Firefox, MDN) before building or changing browser UI, CSS layout/animation, forms, accessibility, client-side performance, or client-side web APIs in Tickist's Angular app.
  Use for: dialogs/modals, popovers, menus, dropdowns, custom selects, tooltips, toasts, tables, dark mode/theming, container queries, view transitions, scroll effects, form validation and autofill, passkeys, Core Web Vitals (LCP, INP, CLS), image/script priority, HTML sanitization, dates/timezones, or a requested legacy-pattern audit.
  Skip for: Supabase/SQL, Edge Functions, the MCP Worker, CI, Nx/tooling configuration, tests-only edits, copy changes, and renames.
---

# Modern Web Guidance (Tickist)

Search and retrieve standardized modern web best practices before implementing or
changing web UI, CSS layout/animation, or client-side JS logic, instead of writing
ad-hoc solutions or adding dependencies. Tickist adaptations are listed in
[UPSTREAM.md](UPSTREAM.md).

The CLI is pinned to `modern-web-guidance@1.0.0`. Do not switch to `@latest`; a
version bump is a reviewed skill update (see UPSTREAM.md).

## Primary workflow

### Step 1. Search use cases

Run the CLI with a **2–5 word action-oriented query** for a **single web platform
capability or UI pattern**:

- **Keep queries focused and generic**: describe the user-visible capability
  (`<verb> + <UI/platform object>`, optionally with the HTML/CSS/JS feature name).
  Omit framework names (`Angular`, `Tailwind`, `DaisyUI`) and Tickist nouns
  (task, project, sidebar, component/file names). Split multi-feature tasks into
  separate `search` calls.
- **Name implied UI primitives**: translate domain intent into the UI component
  or platform mechanism (search `"confirm dialog"`, not `"confirm task deletion"`;
  `"date picker input"`, not `"pick a due date"`).
- **Example**: `"light dismiss dialog"` or `"responsive data table"`, **not**
  `"dialog"` (too terse), `"responsive table dark mode"` (compound — split it), or
  `"close Angular settings modal on outside click"` (framework/app noise).

```sh
npx -y modern-web-guidance@1.0.0 search "<query>" --skill-version 2026_11_09-5bcc021b
```

Returns `[{ "id", "description" }, ...]`. Judge results by `description`:

- **Match found**: call `retrieve` directly; do not also run `list`.
- **Weak or empty results**: rephrase `search` once with the concrete HTML/CSS/UI
  noun or synonym (`dialog`, `modal`, `popover`, `table`, `form`) before falling
  back to `list` (or use `list` once for a broad UI audit).
- **Topic not covered**: proceed without retrieving unrelated guides.

### Step 2. Retrieve best practices

Retrieve the matching guide(s) plus any broader discipline guide that applies
(`html`, `css`, `forms`, `accessibility`, `performance`, `security`). Pass
multiple IDs separated by commas.

```sh
npx -y modern-web-guidance@1.0.0 retrieve "<id>"
```

If `retrieve` saves large output (> 9.5 KB) to a temporary file, read that file in
full with the file-reading tool.

### Step 3. Verify guidance compliance

Before concluding, cross-check the implementation against the retrieved guide:

- The relevant modern pattern and the fallbacks required by Tickist's browser
  support policy (below) are applied, without forcing unrequested features.
- The user's request is fully satisfied, and Tickist's normal verification from
  `AGENTS.md` (lint, focused tests, build, relevant E2E) still applies.
- Do not run `legacy-scan` for a specific feature; it is for broad audits only.

### Step 4. Mention guide use briefly

In the handoff for changes shaped by a guide, name the guide ID(s) in one short
line with the non-obvious choice each one drove (for example a fallback or an
override). Do not add a separate mandatory section, and do not cite guide IDs or
quotes from memory after context compaction — re-run `search`/`retrieve` instead.

## Alternative flow: audit or modernize the codebase

**Only** for a broad, open-ended modernization or legacy-pattern audit with no
specific feature named:

```sh
npx -y modern-web-guidance@1.0.0 legacy-scan apps/tickist-web/src --json
```

1. **Scan** the requested path.
2. **Verify** each finding against its `keepWhen` / `dropWhen` rubric and the
   Angular notes below; drop false positives.
3. **Report** verified findings, noting that `legacy-scan` covers only the ~20% of
   guides with deterministic rules.
4. **Modernize** only when asked to change code: retrieve each finding's guide,
   apply the replacement, run normal verification, and re-run `legacy-scan` on the
   changed files. Dropped findings may still match; do not edit safe code to reach
   zero findings.

## Adapting guides to Tickist

Guides use vanilla HTML/CSS/JS. Keep the modern feature when translating it:

- **Templates**: bind newly shipped attributes that Angular does not know with
  `[attr.popover]`, `[attr.commandfor]`, `[attr.command]`, `[attr.interestfor]`, or
  write static attributes literally; do not drop them and do not use `any`.
- **SSR**: the app uses `@angular/ssr`. Call `showModal()`, `showPopover()`,
  `moveBefore()` and other DOM APIs through `viewChild()` element refs inside
  `afterNextRender`/`afterRenderEffect` or event handlers, never during server
  rendering. Feature-detect with `typeof`/`in` checks on the client.
- **IDs and anchors**: generate per-instance IDs and `anchor-name` values for
  repeated components (lists of tasks or projects).
- **Styles**: components use Angular's emulated encapsulation, not Shadow DOM.
  `:host-context()` is rewritten by the compiler and works in every browser, so a
  "non-standard `:host-context`" finding is a false positive unless a component
  uses `ViewEncapsulation.ShadowDom`. `::backdrop` and `@starting-style` work in
  component stylesheets; global `:root` tokens and properties registered with
  `@property` belong in `apps/tickist-web/src/styles.css`.
- **Existing conventions**: keep standalone components, signals, built-in control
  flow, supported themes, responsive sheets, and keyboard access (see `AGENTS.md`).

## Browser support and fallbacks

Follow the **Browser support** policy in `AGENTS.md`. Use each guide's compatibility
data: a Baseline Widely available feature needs no fallback; for other features,
apply the guide's fallback recommendation within the limits that policy sets. If a
guide's only fallback is a heavy polyfill or new dependency, report that tradeoff
instead of adding it silently.

## Running the CLI

- Use `npx -y modern-web-guidance@1.0.0 …` (npm is the project's package manager).
  Claude Code project settings allow exactly this command prefix.
- The first run downloads the package from npm and needs network access. If the
  command hangs offline after a previous download, retry with `npx --offline …`.
  If `~/.npm` is read-only in a sandbox, set `NPM_CONFIG_CACHE` to a writable
  temporary directory.
