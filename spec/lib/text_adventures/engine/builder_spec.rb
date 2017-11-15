require 'spec_helper'

class Dumb
  extend TextAdventures::Engine::Builder
  attr_reader :name, :price

  def initialize(options = {})
    @name = options[:name]
    @price = options[:price]
  end
end

describe Dumb do

  describe '#database' do
    it "load yaml file in database dir" do
      allow(YAML).to receive(:load_file) { {dumb: {name: 'dumb', price: 10}} }
      expect(Dumb.database).to eq(dumb: {name: 'dumb', price: 10})
      expect(YAML).to have_received(:load_file)
    end
  end

  describe '#[]' do
    it "return valid object" do
      expect(Dumb[:dumb]).to be_kind_of Dumb
    end

    it "attributes match database" do
      dumb = Dumb[:dumb]
      expect(dumb.name).to eq 'dumb'
      expect(dumb.price).to eq 10
    end

    it 'return nil when name dont match' do
      expect(Dumb[:wrong]).to be nil
    end
  end
end