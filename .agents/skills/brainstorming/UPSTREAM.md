# Brainstorming provenance

- Source: [obra/superpowers](https://github.com/obra/superpowers/tree/b739a8af570e10a95898f2bdf6cec97467fa6c12/skills/brainstorming).
- Revision: `b739a8af570e10a95898f2bdf6cec97467fa6c12` (main resolved on 2026-10-21).
- Installed with the Codex skill-installer GitHub helper, with an explicit project destination and pinned revision.
- License: MIT; the upstream notice is preserved in [LICENSE](LICENSE).
- Canonical location: `.agents/skills/brainstorming/` in tickist-app.
- Claude Code: `.claude/skills/brainstorming` points to this directory.
- The parent workspace has a small Codex entrypoint and a Claude symlink to this directory; these parent files are local workspace configuration, outside both Git repositories.

## Local changes

The original conversation and design workflow is retained. Discovery is narrowed
to unresolved design decisions and explicit requests. Tickist integration keeps
routine work direct, honors existing consent, routes implementation designs to
`doc/designs/`, and keeps business planning in management. It removes automatic
commits, mandatory subagents and the dependency on superpowers:writing-plans.
The optional visual guide defers to project browser consent and Windows/WSL rules;
its bundled scripts remain unmodified reference assets and are not started during
installation. No other Superpowers skills, hooks, or plugins are installed.

Review local adaptations before updating; do not overwrite them blindly.
Hashes below identify the original files before local adaptations, not the
modified files now installed.

```json
{
  "SKILL.md": "6ee10d1481b8a2580d5336ff66c5c08acc9d4b251b13bbc3bfd31be99c261d43",
  "builder-check-prompt.md": "36d51a4723d6f0a3ce5811a0ea3b3a8424f07533947e1355f5d8cb8cce40c55e",
  "scripts/frame-template.html": "6a8a4e58bd6a44b904e2e3c57de774481d909204597e1498de53f1b2fecc4c4e",
  "scripts/helper.js": "43c6d69954a46ec34a2a262bcc62a9a7e83e839c739f199cb72646d397c686e3",
  "scripts/server.cjs": "763abf96510e0b892a1141397b31aa82ef900cf87ed34dde94bc8782baf4a7ca",
  "scripts/start-server.sh": "a4e5ae84275bcaacd2f84345afeabe59cf7b00ba080e123da7cc1fb226f12847",
  "scripts/stop-server.sh": "0b5ccbbd57f62d3ed88993f7940b5ee0e5c0fc9b21c550c623da4f6292e47daf",
  "visual-companion.md": "6ffcb038b53254bd31debaa15e12dcd4ff24bd63d690e0b644ac6396701cf2e2"
}
```
