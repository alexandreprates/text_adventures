require 'bundler'
require 'spec_helper'

RSpec.describe "Project dependency setup" do
  let(:root) { File.expand_path("..", __dir__) }

  it "keeps Bundler local install artifacts ignored" do
    gitignore = File.read(File.join(root, ".gitignore"))

    expect(gitignore).to include(".bundle/")
    expect(gitignore).to include("vendor/bundle/")
  end

  it "checks in a lockfile for the declared dependencies" do
    lockfile = File.read(File.join(root, "Gemfile.lock"))
    parser = Bundler::LockfileParser.new(lockfile)

    expect(parser.dependencies.keys).to contain_exactly("base64", "rake", "rspec", "ruby-lsp", "sqlite3")
    expect(parser.specs.map(&:name)).to include("rake", "rspec")
  end

  it "defines separate Docker targets for the web proxy and game server" do
    dockerfile = File.read(File.join(root, "Dockerfile"))
    compose = File.read(File.join(root, "docker-compose.yml"))
    orange_compose = File.read(File.join(root, "docker-compose-orange.yml"))
    nginx_config = File.read(File.join(root, "frontend", "nginx.conf"))

    expect(dockerfile).to include("FROM nginx:alpine AS web")
    expect(dockerfile).to include("FROM ruby:alpine AS app")
    expect(dockerfile).to include("HEALTHCHECK")
    expect(dockerfile).to include("/api/health")
    expect(compose).to include("target: app")
    expect(compose).to include("target: web")
    expect(compose).to include("TEXT_ADVENTURES_MAX_CONNECTIONS")
    expect(compose).to include("TEXT_ADVENTURES_SAVE_DIR: /text_adventures/storage/games")
    expect(compose).to include("./lib:/text_adventures/lib:ro")
    expect(compose).to include("./data:/text_adventures/data:ro")
    expect(compose).to include("./frontend/public:/usr/share/nginx/html:ro")
    expect(compose).to include("./storage/games:/text_adventures/storage/games")
    expect(compose).to include("condition: service_healthy")
    expect(orange_compose).to include("cloudflare:")
    expect(orange_compose).to include("condition: service_healthy")
    expect(orange_compose).to include("TEXT_ADVENTURES_SAVE_DIR: /text_adventures/storage/games")
    expect(orange_compose).to include("./lib:/text_adventures/lib:ro")
    expect(orange_compose).to include("./data:/text_adventures/data:ro")
    expect(orange_compose).to include("./frontend/public:/usr/share/nginx/html:ro")
    expect(orange_compose).to include("text_adventures_orange_games:/text_adventures/storage/games")
    expect(nginx_config).to include("proxy_pass http://server:4567")
    expect(nginx_config).to include("location ^~ /game/")
    expect(nginx_config).to include("location /api/")
    expect(nginx_config).to include("location /ws")
  end

  it "documents the browser frontend as the playable MVP surface" do
    agent_instructions = File.read(File.join(root, "AGENTS.md"))
    readme = File.read(File.join(root, "README.md"))

    expect(agent_instructions).to include("The current playable surface is the browser frontend")
    expect(agent_instructions).to include("bin/text_adventures` starts the Ruby JSON API and WebSocket game server")
    expect(readme).to include("The game is playable through the browser frontend served by Nginx")
    expect(readme).to include("bin/text_adventures          JSON API server entrypoint")
    expect(readme).to include("TEXT_ADVENTURES_SESSION_TTL_SECONDS")
    expect(readme).to include("TEXT_ADVENTURES_SAVE_DIR")
    expect(readme).to include("/game/<game_id>")
    expect(readme).to include("curl -sS http://127.0.0.1:4567/api/health")
  end
end
