# Agent Instructions

These instructions apply to this repository.

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
