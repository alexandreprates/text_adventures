# Agent Instructions

These instructions apply to this repository.

## Frontend rules

- Use React + TypeScript.
- Prefer existing components in `src/components/ui`.
- Use shadcn/ui before creating custom components.
- Use Tailwind utility classes; avoid custom CSS unless necessary.
- Do not introduce new UI libraries without approval.
- Every screen must support desktop and mobile layouts.
- Every async page must handle loading, empty, error and success states.
- Forms must include validation messages and accessible labels.
- Prefer semantic HTML.
- Do not hardcode colors directly; use design tokens/classes.
- Keep components small and composable.

## Visual quality

- Use consistent spacing: 4, 6, 8, 12, 16, 24, 32.
- Use one visual hierarchy per page: title, description, primary action, secondary actions.
- Avoid generic AI-looking gradients unless requested.
- Prioritize clean enterprise SaaS UI: cards, clear typography, whitespace, responsive grids.

## Commands

After frontend changes, run:

- `pnpm lint`
- `pnpm test`
- `pnpm playwright test`
- `pnpm storybook` when changing reusable components

## Communication

- Speak with the user in Brazilian Portuguese.
- Keep user-facing updates concise, natural, and collaborative.
- Write code, comments, documentation, commit messages, task notes, prompts, and persistent memory entries in English.
- Keep identifiers, filenames, branches, classes, methods, variables, and test names in English.

## Repository Practices

- Prefer existing project patterns over new abstractions.
- Keep gameplay logic independent from web transport details.
- Prefer editing content through YAML when the change is content-driven.
- Use `rg` or `rg --files` for searches.
- Use `apply_patch` for manual file edits.
- Do not revert user changes unless explicitly requested.
- Avoid destructive git commands such as `git reset --hard` or `git checkout --`.
- Keep commits focused and use English commit messages.

## Tooling Guidance

- Use Serena as the default way to inspect code references, symbol relationships, implementations, and diagnostics before falling back to plain text searches.
- Use Context7 for implementation examples, current library/framework guidance, and API usage patterns before relying on memory or ad hoc examples.
- Prefer Serena for repository-local understanding and Context7 for external library or framework guidance.

## MCP Usage Rules

Use MCPs deliberately and explain briefly when one is unavailable or not useful for the task.

### Serena MCP

- Use Serena as the primary project-local code intelligence tool.
- Activate this project with Serena before repository-aware work when it is not already active.
- Prefer Serena for:
  - symbol discovery and source overviews;
  - finding declarations, implementations, and references;
  - checking diagnostics for touched files;
  - safe symbol-level edits when replacing or inserting whole functions/classes/methods;
  - reading or updating local project memories.
- Use Serena memories for compact, project-local agent guidance such as architecture notes, conventions, validation commands, and durable implementation invariants.
- Keep Serena memories concise, English-only, and focused on stable facts. Do not store secrets, transient logs, or one-off command output.
- After changing Serena memories, run `serena memories check` when available and report any issue.
- Fall back to `rg`, file reads, and `apply_patch` when:
  - the target is plain HTML/CSS/docs/config rather than analyzable code symbols;
  - the needed edit is a small line-level change;
  - Serena cannot resolve the symbol or project state.

### Basic Memory MCP

- Use Basic Memory for durable cross-session knowledge that should survive beyond the local repository state.
- Prefer Basic Memory for:
  - implementation plans requested by the user;
  - exploratory findings and validation evidence;
  - architectural decisions and design rationale;
  - session handoff notes;
  - completion status for saved plans, including validation commands and commit hashes.
- Before creating a new Basic Memory note, search for related notes to avoid duplicates and append/update the existing note when appropriate.
- Store Basic Memory notes in English, with enough context for a future session to resume without rereading the whole conversation.
- Do not store secrets, credentials, private tokens, raw long logs, or volatile command output.
- When a saved Basic Memory plan drives implementation, update that note after completion with:
  - what changed;
  - validation performed;
  - known remaining risks or follow-up work;
  - commit hash when a commit was created.

### Context7 MCP

- Use Context7 for external library/framework/API knowledge, especially when the answer may depend on current documentation or version-specific behavior.
- Always resolve the library ID first with Context7 unless the user already provided an exact `/org/project` or `/org/project/version` ID.
- Prefer Context7 over memory or guesswork for:
  - framework/library setup;
  - API usage examples;
  - dependency or version-specific implementation details;
  - unfamiliar third-party tools used by this repository.
- Do not send secrets, private data, proprietary snippets, or credentials to Context7 queries.
- Keep Context7 usage focused: ask specific questions and avoid broad documentation dumps.
- If Context7 has no good match or is unavailable, state that briefly and proceed with repository-local evidence or official documentation when needed.

### MCP Coordination

- Use Serena first for repository-local questions and Context7 first for external-library questions.
- Use Basic Memory before and after long-running or plan-driven work: read relevant notes at the start, then update durable notes at the end.
- Do not use Basic Memory as a substitute for reading current source code; verify implementation details with Serena or local files.
- Do not use Context7 as a substitute for project conventions; align external examples with the repository's existing patterns before editing.
- For simple tasks, avoid unnecessary MCP calls when local context is already sufficient.

## Development Cycle

When asked to implement a task, use this loop until the requested work is fully handled:

1. Read the relevant plan, memory note, source files, and tests.
2. Pick the next concrete task.
3. Implement the smallest complete change that satisfies the task.
4. Add or update focused tests for the change.
5. Run focused tests.
6. Run the full test suite.
7. If tests fail, investigate the cause, fix it, and repeat validation.
8. Review the implementation against the stated requirements.
9. If something is missing, implement it before committing.
10. Perform a short binary or exploratory validation when the change affects gameplay or UX.
11. Commit the completed change.
12. Update the relevant plan or Basic Memory note when the task came from a saved plan.
13. Continue with the next item when the user requested a queue or loop.

## Validation

- For routine code changes, run:

```sh
bundle exec rspec
```

- For gameplay changes, prefer an additional deterministic API server smoke run:

```sh
TEXT_ADVENTURES_RANDOM_SEED=0 bin/text_adventures
```

- Report clearly when tests or exploratory validation could not be run.

## Game-Specific Notes

- The current playable surface is the browser frontend served by the Compose web service.
- `bin/text_adventures` starts the Ruby JSON API and WebSocket game server.
- Text commands are translated to structured web actions by the frontend.
- Dungeon rendering uses a fixed 3x3 viewport centered on the player's current block.
- Dungeon symbols are runtime render markers:
  - `x` player
  - `E` visible enemy
  - `@` loot
  - `.` open floor
  - `#` wall
  - `?` unrevealed area
- Do not put enemy or loot markers directly into dungeon block YAML tiles.
- Content files live under `data/`:
  - `data/items.yml`
  - `data/shops.yml`
  - `data/creatures.yml`
  - `data/dungeon_blocks.yml`

## Basic Memory

- Use Basic Memory for plans, exploratory findings, and durable implementation notes when the user asks for it.
- Store memory notes in English.
- When a saved plan drives implementation, update that note with completion status, validation, and commit hashes.
