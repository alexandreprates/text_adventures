require 'bundler'
Bundler.require(:default, ENV['RACK_ENV'] || :test)

module TextAdventures
end

require './lib/text_adventures/engine'
