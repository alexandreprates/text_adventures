# Tech Stack

- Runtime: Ruby on Linux; no framework dependency for the core game.
- Package manager: Bundler with checked-in `Gemfile.lock`; local installs commonly use `bundle config set --local path vendor/bundle` and install into `vendor/bundle`.
- Gems:
  - Runtime: `base64`, `rake`, `sqlite3`.
  - Development: `ruby-lsp` for Serena/editor LSP support.
  - Test: `rspec`.
- Test runner: RSpec through `bundle exec rspec` or Rake default task.
- Server entrypoint: `bin/text_adventures [server]`, which starts `TextAdventures::Web::Server.from_env.start`.
- Containers:
  - `Dockerfile` has `web` target from `nginx:alpine` and `app` target from `ruby:alpine`.
  - `docker-compose.yml` builds `server` from target `app` and `web` from target `web`; web exposes host port 3000 and proxies to server port 4567.
- Frontend: plain static HTML/CSS/JavaScript under `frontend/public`; no frontend package manager or build step observed.
- Nginx serves immutable `/assets/*`, no-cache HTML/CSS/JS/JSON/MD, proxies `/api/` and `/ws` to the Ruby server.
- Important env vars: `TEXT_ADVENTURES_HOST`, `TEXT_ADVENTURES_PORT`, `TEXT_ADVENTURES_RANDOM_SEED`, `TEXT_ADVENTURES_MAX_CONNECTIONS`, `TEXT_ADVENTURES_MAX_SESSIONS`, `TEXT_ADVENTURES_SESSION_TTL_SECONDS`, `TEXT_ADVENTURES_READ_TIMEOUT_SECONDS`, `TEXT_ADVENTURES_WEBSOCKET_IDLE_TIMEOUT_SECONDS`, `TEXT_ADVENTURES_SAVE_DIR`, `TEXT_ADVENTURES_SAVE_HISTORY_LIMIT`.