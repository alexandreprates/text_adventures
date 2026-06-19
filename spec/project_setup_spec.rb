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

    expect(parser.dependencies.keys).to contain_exactly("base64", "rake", "rspec")
    expect(parser.specs.map(&:name)).to include("rake", "rspec")
  end

  it "defines separate Docker targets for the web proxy and game server" do
    dockerfile = File.read(File.join(root, "Dockerfile"))
    compose = File.read(File.join(root, "docker-compose.yml"))
    orange_compose = File.read(File.join(root, "docker-compose-orange.yml"))
    nginx_config = File.read(File.join(root, "frontend", "nginx.conf"))

    expect(dockerfile).to include("FROM nginx:alpine AS web")
    expect(dockerfile).to include("FROM ruby:alpine AS app")
    expect(compose).to include("target: app")
    expect(compose).to include("target: web")
    expect(orange_compose).to include("cloudflare:")
    expect(nginx_config).to include("proxy_pass http://server:4567")
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
  end
end
