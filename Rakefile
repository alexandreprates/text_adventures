require 'rake/testtask'
require 'yard'

Rake::TestTask.new do |t|
  t.libs << 'test'
  t.pattern = "test/*_test.rb"
end

YARD::Rake::YardocTask.new do |t|
 t.files   = ['lib/**/*.rb']
 t.stats_options = ['--list-undoc']
end

task :default => [:test, :yard]