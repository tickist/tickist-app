# Modern Web Guidance provenance

- Source: [GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance/tree/4dd968349e54ca45a05dd5c818fb035c9054b022/skills/modern-web-guidance).
- Revision: `4dd968349e54ca45a05dd5c818fb035c9054b022` (main resolved on 2026-11-15).
- CLI: npm package `modern-web-guidance@1.0.0` (published 2026-11-10, integrity
  `sha512-vafIZwC8AS6QjM2yyoflZbnc7n3/TVOMLbEMRdPTwcFy0f9/Tq8s5rJQ8UIqRt2KPl9ixravyaMR4nTGuUrcmg==`).
  The guides are served by the CLI; they are not copied into this repository.
- License: Apache-2.0; the upstream license is preserved in [LICENSE](LICENSE).
- Canonical location: `.agents/skills/modern-web-guidance/` in tickist-app.
- Claude Code: `.claude/skills/modern-web-guidance` points to this directory. The
  parent workspace has a Claude symlink and a Codex forwarding entrypoint; these
  parent files are local workspace configuration, outside both Git repositories.
- Only the `modern-web-guidance` skill is installed. The upstream
  `chrome-extensions` skill and the plugin manifests are not used.

## Local changes

The search → retrieve → verify workflow and the `legacy-scan` audit flow are
retained. Tickist integration:

- Replaces the "MANDATORY: execute first for all HTML/CSS/JS" trigger with a
  specific description, matching the repository rule that skills load when they
  help, not on keyword matches. Backend, tooling, test-only and copy work is
  excluded.
- Pins the CLI to `@1.0.0` instead of `@latest`, so a new package version is a
  reviewed update rather than code fetched silently on every call.
- Replaces the mandatory `### Modern Web Guidance` response section with a short
  mention of guide IDs in the handoff.
- Points browser-support decisions to the policy in `AGENTS.md`.
- Adds Angular notes: attribute bindings for new HTML attributes, SSR-safe DOM
  calls, per-instance IDs, and emulated view encapsulation (`:host-context()`
  findings are false positives there).
- Drops the pnpm/Windows runner notes; Tickist uses npm on Linux/WSL.

## Updating

Review local adaptations before updating; do not overwrite them blindly. To
update, compare the new upstream `SKILL.md` with the hash below, check the npm
release, change the pinned version in `SKILL.md` and `.claude/settings.json`
(when that permission rule exists), and update `skills-lock.json`.

Hashes identify the original files before local adaptations:

```json
{
  "SKILL.md": "37d68a514c25066840299356e5857b750bec3cc27c0cf57dbe88369b051b573e",
  "LICENSE": "cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30"
}
```
