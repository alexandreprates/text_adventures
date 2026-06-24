# Master Reset 2026-06-24

- Local `master` was reset to `origin/master` at `73d58e5 Replace spear brace with opening thrust` after the remote branch was force-updated.
- Treat `origin/master` as the canonical source of truth for this repository state.
- The following local commits were intentionally discarded and must not be assumed present unless reimplemented from scratch:
  - `7f0834a Add deterministic dungeon floor generator`
  - `5aa1765 Migrate dungeon movement to generated floors`
  - `cf7d929 Preplace visible dungeon enemies`
  - `b447d98 Add continuous dungeon wall tileset`
  - `f8889bb Render dungeon walls with square autotile style`
  - `19d637b Prioritize nearby loot before new encounters`
  - `e04425a Return socket reloads to town consistently`
  - `aa679b7 Prioritize auto loot before hunting enemies`
  - `f0d2d1e Ignore local environment file`
- Current recent accepted remote commits are `ecb734b`, `f0e8d7c`, `dd923df`, `3ff04f9`, and `73d58e5`, covering nature magic XP and weapon class combat mechanics.
- Before using older Basic Memory plans about generated dungeon floors, canvas/autotile wall tiles, preplaced visible enemies, or auto-loot priority fixes, verify the current source tree first.