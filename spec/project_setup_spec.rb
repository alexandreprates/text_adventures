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
end
