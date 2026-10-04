# anti-slop provenance

- Source: https://github.com/dmmulroy/anti-slop
- Revision: `c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b`
- Copied from: `skills/install-anti-slop/assets/anti-slop/` at that revision. Upstream's `scripts/sync-skill-assets.mjs --check` confirmed the bundled production source matches `src/`.
- Installed at: `tools/oxlint/anti-slop/`; the generic plugin entry point is `index.ts`.
- Local additions: this provenance file and the upstream repository's MIT `LICENSE`. The vendored rule source is unchanged.
- Configuration: the generic plugin is registered in the root `.oxlintrc.json`. The Effect plugin source is copied with the bundle but not registered because Tickist has no direct Effect dependency.

The nested `vendor/eslint-stylistic/LICENSE` and `UPSTREAM.md` document the spacing rule's upstream code.
