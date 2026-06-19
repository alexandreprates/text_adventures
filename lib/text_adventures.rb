require 'bundler/setup'
require 'bundler'

Bundler.require(:default, ENV['RACK_ENV'] || :development)

module TextAdventures
  ROOT = File.expand_path("..", __dir__)
  SOURCE_DIRECTORIES = %w[
    core_exten
    domain
    commands
    scenes
    web
  ].freeze

  def self.load_project_files
    SOURCE_DIRECTORIES.each do |directory|
      pattern = File.join(ROOT, "lib", directory, "**", "*.rb")
      Dir[pattern].sort.each { |file| require file }
    end
  end
end

TextAdventures.load_project_files
