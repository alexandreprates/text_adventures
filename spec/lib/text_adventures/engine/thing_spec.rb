require 'spec_helper'

describe TextAdventures::Engine::Thing do
  let!(:rock) { TextAdventures::Engine::Thing.new name: 'Rock', price: 1}

  describe "#name" do
    it "be mandatory" do
      expect { described_class.new }.to raise_error "name is required"
    end
    it "show name when to_s" do
      expect(rock.to_s).to eq 'Rock'
    end
  end

  describe "#price" do
    it "be mandatory" do
      expect { described_class.new name: 'One Ring' }.to raise_error "price is required"
    end
  end

  describe '#can_pick_up?' do
    it "return true" do
      expect(rock.can_pick_up?).to be true
    end
  end

end