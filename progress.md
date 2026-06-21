Original prompt: abra o navegador e observe a interface, em monitores grandes a fonte fica muito pequena, encontre uma forma de corrigir, para rodar o projeto use o docker compose

## Progress

- Started investigation of large-monitor UI font scaling issue.
- Observed the app at 2560x1440 through Docker Compose; most panel text remained at 12px or 13px while the map area expanded.
- Updated frontend CSS to use breakpoint-driven font and layout tokens for large displays.
- Rebuilt Docker Compose, verified 1920x1080 and 2560x1440 in Chrome DevTools with no overflow or console errors.
- Ran `docker compose run --rm server bundle exec rspec`: 430 examples, 0 failures.
- Increased the large-display font scale again per follow-up request.
- Rebuilt Docker Compose, verified 1920x1080 and 2560x1440 in Chrome DevTools with no overflow or console errors.
- Ran `docker compose run --rm server bundle exec rspec`: 430 examples, 0 failures.

## Notes

- `bundle exec rspec` is unavailable on the host because `bundle` is not installed; validation was run inside the Compose server container.
- The Playwright skill client could not run because the `playwright` package is not installed where the skill script resolves imports.

## 2026-06-21 Town NPC Trade Test

- Tested through the browser UI at `http://localhost:3000` with Docker Compose services already running.
- Created a fresh game from the command bar, then used town command-menu buttons to enter Blacksmith and Tavern.
- Blacksmith: command-menu navigation worked; `Estoque` listed Sword, Hunting Spear, Rusty Dagger, and Iron Dagger; `Comprar` attempted the default shop item and failed correctly with insufficient gold.
- Tavern: command-menu navigation worked; `Estoque` listed Potion of Heal and Antidote.
- Tavern sale flow requires an explicit target: clicking the generic `Vender` button sends `sell` and returns `Missing target for sell`; typing `sell potion of heal` opens the confirmation flow, and the menu `Confirmar` button completes the sale.
- Sold two Potion of Heal items, reaching 14g; then used the menu `Comprar` button and `Confirmar` to buy Potion of Heal for 10g. Final state: 4g and 4x Potion of Heal.
- Chrome console had no warnings or errors. Screenshot evidence saved at `/tmp/text_adventures_tavern_trade_test.png`.

## 2026-06-21 WebSocket Reconnect Fix

- Implemented automatic frontend WebSocket reconnection after unexpected disconnects.
- Reconnect behavior: set status to `Reconnecting`, retry every 10 seconds, and enter `Error` only after 2 minutes without reconnecting.
- Intentional disconnects such as starting a new game stop any reconnect timer.
- Manual validation: stopped the Docker Compose `server` service while the browser was open; UI changed to `Reconnecting`; restarted `server`; UI returned to `Online`, `Auto: stopped`, and accepted menu actions through the reconnected socket.
- Validation commands: `node --check frontend/public/app.js`; `docker compose run --rm server bundle exec rspec spec/web/frontend_assets_spec.rb`; `docker compose run --rm server bundle exec rspec`.

## 2026-06-21 Auto Explore Speed Controls

- Added map control buttons `>`, `>>`, and `>>>` before the zoom buttons to select auto explore speed.
- Default speed remains `>` at 1x, preserving the previous 520ms delay.
- `>>>` sets `speedMultiplier` to 3 and reduces the effective auto delay to 173ms.
- Manual validation: opened `http://localhost:3000` at 2560x1440 through Docker Compose, confirmed the default pressed state, selected `>>>`, entered the ruins, and ran auto explore through movement, combat, and loot.
- Console validation: no warnings or errors after the browser smoke test.
- Validation commands: `node --check frontend/public/app.js`; `docker compose run --rm server bundle exec rspec spec/web/frontend_assets_spec.rb`; `docker compose run --rm server bundle exec rspec`.

## 2026-06-21 Merchant Trade Overlay

- Implemented a centered merchant trade overlay with player sellable items on the left, merchant stock on the right, and transaction gold summary in the center.
- Added serialized `trade` state for merchant scenes so the frontend does not duplicate shop YAML data.
- Added a combined `trade` action that validates selected buy/sell items server-side and applies one transaction.
- Replaced merchant quick command buy/sell/show buttons with `Loja`.
- Manual validation: opened Tavern shop through Docker Compose, sold one Potion of Heal, then reloaded and performed a combined sell Potion of Heal + buy Antidote transaction. Final state updated to 6g, 1x Antidote, and 3x Potion of Heal.
- Visual validation: inspected desktop and mobile screenshots; fixed mobile trade summary overlap with max-content grid rows.
- Console validation: no warnings or errors after browser checks.
- Validation commands: `node --check frontend/public/app.js`; focused RSpec files for merchant, serializer, action parser, command parser, frontend assets, and state patch; `docker compose run --rm server bundle exec rspec` (433 examples, 0 failures).

## 2026-06-21 Frontend Browser Test Round

- Ran an exploratory browser test round through Docker Compose at `http://localhost:3000`.
- Desktop flow: opened Tavern shop, verified insufficient-gold blocking, Escape close behavior, sell-only transaction, combined sell/buy transaction, and final inventory/gold updates.
- Desktop flow: opened Blacksmith shop, verified player consumables are disabled because the merchant does not buy them, and verified insufficient-gold blocking for weapon purchase.
- Mobile flow at 390x844: opened Blacksmith shop, verified stacked trade layout, no button overflow, disabled sell items, and insufficient-gold selection state.
- Chrome console validation: no warnings or errors.
- No additional frontend defects were found in this round, so no new code fix was required after the existing merchant overlay implementation.
- Validation commands: `node --check frontend/public/app.js`; `docker compose run --rm server bundle exec rspec` (433 examples, 0 failures).

## 2026-06-21 Frontend Browser Test Round 2

- Rebuilt Docker Compose before testing so the browser used the latest local frontend and Ruby changes.
- Finding: local command/parser errors such as `city` and `go` changed the connection indicator to `Error` even though the WebSocket was still online.
- Fix: classified local and server `invalid_action` command errors separately and kept the connection status `Online` for user/action errors.
- Finding: while a battle was active in the ruins, the context command panel still prioritized auto-explore commands and did not show `Atacar`.
- Fix: battle-active states now render battle commands first, including `Atacar` and suggested usable inventory items.
- Browser validation: invalid command and missing-target command now show log errors while status remains `Online`.
- Browser validation: auto explore at 3x entered combat, rendered `Atacar` during battle, completed fights, collected loot, and kept status `Online`.
- Mobile validation at 390x844: dungeon layout, Tavern shop overlay, sell transaction, gold update, and inventory update worked without horizontal overflow.
- Chrome console validation: no warnings or errors.
- Validation commands: `node --check frontend/public/app.js`; `docker compose run --rm server bundle exec rspec spec/web/frontend_assets_spec.rb`; `docker compose run --rm server bundle exec rspec` (433 examples, 0 failures).

## 2026-06-21 Dungeon Reload Auto Explore Memory Fix

- Reproduced the reload-sensitive dungeon navigation issue after exploring away from the entrance portal.
- Root cause: auto-explore path memory lived only in JavaScript runtime state, so a page reload discarded known cells, visited positions, failed moves, and transition markers.
- Fix: persist auto-explore memory in `localStorage` per `game_id`, restore it on render after reload, and save it whenever viewport knowledge, visited cells, or failed moves change.
- Fix: starting `Go Town` or `Go Deep` no longer clears the restored exploration memory before pathfinding.
- Browser validation: explored ruins, confirmed persisted memory had 150 known cells, reloaded the page, clicked `Go Town`, and the character returned to Town successfully.
- Chrome console validation: no warnings or errors.
- Validation commands: `node --check frontend/public/app.js`; `docker compose run --rm server bundle exec rspec spec/web/frontend_assets_spec.rb`; `docker compose run --rm server bundle exec rspec` (433 examples, 0 failures).

## 2026-06-21 Page Load Returns Ruins Games To Town

- Changed page-load resume semantics so `GET /api/games/:id` moves any ruins session back to Town before returning state.
- The server-side transition clears battle, pending loot, active enemy position, and pending confirmation state to avoid carrying transient dungeon state into Town.
- The transition is saved to persistence so opening the same game from another browser also sees Town.
- The frontend clears persisted auto-explore memory whenever the loaded state is not ruins, preventing stale dungeon path data from being reused after re-entering ruins.
- Browser validation: entered ruins, reloaded the page, and confirmed the reloaded state rendered Town immediately.
- Chrome console validation: no warnings or errors.
- Validation commands: `node --check frontend/public/app.js`; focused domain/router/frontend specs; `docker compose run --rm server bundle exec rspec` (435 examples, 0 failures).

## 2026-06-21 Auto Explore Continues To Next Dungeon Level

- Started implementing automatic floor progression for the `Explore` auto mode.
- Decision: manual `Go Deep` should keep stopping after a successful descent, while `Explore` should switch to descent only after the current level is fully explored and then resume `Explore` on the next level.
- Added a frontend-only `continueAfterDescent` flag to distinguish automatic level progression from the manual descent goal.
- Initial validation commands: `node --check frontend/public/app.js`; `docker compose run --rm server bundle exec rspec spec/web/frontend_assets_spec.rb`.
- Browser validation: started `Explore` at 3x in Ruins L1 and observed normal exploration/combat/loot with the descent discovered and `Go Deep` enabled.
- Controlled browser validation: simulated a fully explored level with a known descent; `nextAutoExploreDecision` switched to `go right`/`Auto: going deep`, then `autoExploreGoalReached` on level 2 kept auto enabled and resumed `Auto: exploring`.
- Final validation commands: `docker compose run --rm server bundle exec rspec` (438 examples, 0 failures). Chrome console had no warnings or errors.
