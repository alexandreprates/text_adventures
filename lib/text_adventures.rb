require 'yaml'
require 'ostruct'
require 'digest/md5'
require 'em-websocket'
require 'em-http-server'
require 'json'

module TextAdventures
  module_function

  def version
    '0.1 beta'
  end
end

# Load all .rb files
Dir['./lib/**/*.rb'].sort.each { |file| require file }
