# Agent tooling

## Design

Tickist's instruction layout follows [OpenAI's guidance on skills and prompts for GPT-6 Astra](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra): keep discovery descriptions specific, load detail only for the relevant workflow, and define completion without prescribing every reasoning step. These are model-independent repository conventions; no model selection or reasoning setting is changed.

`AGENTS.md` contains shared repository facts, access boundaries, and delivery expectations. `CLAUDE.md` imports it instead of maintaining another copy. The knowledge-base index routes by task. Product contracts remain in their domain documents and source code.

## Skills

Canonical maintained entrypoints live under `.agents/skills/`. The existing Claude skill symlinks use those files. GitHub and OpenCode entrypoints forward to the corresponding canonical skill with concise discovery metadata; their older bundled reference/script copies are not the active workflow.

Use a skill when it adds needed knowledge or the user names it. Ordinary code search, a known command, and a request for brevity do not require loading a general tutorial. References are conditional: blog publication, Nx repository imports, and Cloud self-healing have different needs.

The checked-in `skills-lock.json` records upstream installation provenance. Local adaptations are intentional; review diffs before using an installer to refresh them. Upstream READMEs describe their original packages and may assume integrations not installed here. Git history records Tickist's overrides.

### CI routing

`nx.json` sets `neverConnectToCloud: true`. Current monitoring therefore uses GitHub Actions. A one-time status request performs a read; a watch request follows the requested commit to completion or the requested time limit. Fixes and remote mutations need the matching scope.

The Cloud decision/state scripts and configured CI helper remain available for an intentionally connected Cloud workspace. Their detailed workflow is loaded only on that route. Neither a script recommendation nor a skill invocation independently authorizes a push, reset, cancellation, or remote fix.

## Hooks and configuration

The repository currently defines no agent event hooks in `.codex/config.toml` or `.claude/settings.json`. The checkout has no configured Git hooks path and only sample Git hooks. Claude settings register the Nx plugin; hooks from a separately installed plugin or global user configuration are outside this repository's controls.

Caveman startup, mode-tracker, and statistics hooks are not bundled. The stats skill reports available runtime measurements or explains that they are unavailable. A short response style does not imply measured token savings.

Keep hooks for concrete, repeatable automation that improves a workflow. Before adding one:

- identify its runtime, event, input/output contract, and owner;
- keep it bounded and quiet on success;
- avoid injecting the full agent guide or skill catalogue on every prompt/tool call;
- run only the relevant deterministic check, not a whole build or destructive E2E reset after every edit;
- preserve task authorization and surface actionable failures without credentials.

Use ESLint, Prettier, and existing Nx targets for code standards. This update does not change runtime permissions, enable plugins, install global hooks, or alter production/authentication hooks.

## Maintenance and verification

Validate changed skill frontmatter with the installed skill-creator validator. Check local reference links, adapter targets, symlinks, JSON/TOML syntax, and explicit-file formatting. Run changed helper code on meaningful inputs. Do not run app or database suites solely because instruction prose changed.

When evaluating later instruction changes, compare representative task outcomes:

| Request                                | Expected behaviour                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| Fix a typo in one document             | Edit and format that document; no app build or database reset.                          |
| Explain where a component is used      | Focused source search; query Nx only if project boundaries matter.                      |
| Add a task status transition           | Read the relevant contract and verify the database/app behaviour.                       |
| Import a Polish article without images | Create a draft and report image placeholders; no translation/publication.               |
| Check CI status                        | Read the requested commit's GitHub run; no Cloud enrollment or automatic fix.           |
| Watch CI and fix this branch           | Observe, diagnose, and implement within the stated scope; honor push authorization.     |
| Commit and push this change            | Inspect the scope, commit, push, and verify refs without repeated permission questions. |
| Show token savings                     | Use measured evidence or state that it is unavailable.                                  |

File-size reduction is an auditable context proxy, not a token, latency, or quality benchmark. Measure those separately on comparable tasks before claiming improvement.
