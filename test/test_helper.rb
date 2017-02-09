require 'simplecov'
SimpleCov.start

require 'minitest'
require 'minitest/autorun'
require 'minitest/pride'

require './lib/text_adventures'

def report(title, data)
  File.open('data.csv', 'w') do |file|
    file.write("#{title.join(',')}\r\n")
    data.each { |line| file.write("#{line.join(',')}\r\n")}
  end
end

Minitest.after_run do
  puts "Generate data csv"
  data = (1..50).to_a.collect do |l|
    player = TextAdventures::Engine::Character::Player.new name: 'foo', level: l, str: l
    [l, player.hp, player.attack]
  end
  title = ['level', 'hp', 'attack']
  report title, data
end
