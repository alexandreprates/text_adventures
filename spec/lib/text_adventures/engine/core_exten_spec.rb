require 'spec_helper'

describe Object do
  let(:object) { described_class.new }

  describe '#is_weapon?' do
    it "false by default" do
      expect(object.is_weapon?).to be false
    end
  end

  describe '#is_armor?' do
    it "false by default" do
      expect(object.is_armor?).to be false
    end
  end

  describe '#is_equippable?' do
    it "false by default" do
      expect(object.is_equippable?).to be false
    end
  end

  describe '#can_pick_up?' do
    it "false by default" do
      expect(object.can_pick_up?).to be false
    end
  end

end
