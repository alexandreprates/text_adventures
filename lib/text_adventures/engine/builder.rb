require 'yaml'

module TextAdventures::Engine::Builder

  def database
    name = self.name.split('::').last
    @database ||= YAML.load_file "./database/#{name}.yml"
  end

  def [](value)
    item = database[value]
    self.new(item) if item
  end

end