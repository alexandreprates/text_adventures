require 'bundler'
Bundler.require(:default, ENV['RACK_ENV'] || :development)

require './lib/core_ext/range'
require './lib/core_ext/increasable'

# Text Adventures is a text RPG with randomly generated dungeons.
module TextAdventures

end

require './lib/text_adventures/engine'

