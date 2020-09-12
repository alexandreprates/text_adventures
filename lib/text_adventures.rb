Bundler.require(:default, ENV['RACK_ENV'] || :development)

# Load all core extensions
Dir['./lib/core_exten/*.rb'].each { |file| require file }

module TextAdventures
end
