require 'bundler'
Bundler.require(:default, ENV['RACK_ENV'] || :development)

module TextAdventures
end

require './lib/text_adventures/engine'
