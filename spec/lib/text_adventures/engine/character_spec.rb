require 'spec_helper'

describe TextAdventures::Engine::Character do
  let(:frodo)        { described_class.new(name: 'Frodo') }
  let(:leater_armor) { double('LeaterArmor', absorb: 10, is_armor?: true) }
  let(:sting)        { double('Sting', damage: 10, is_weapon?: true) }

  describe "#name" do
    it "be mandatory" do
      expect { described_class.new }.to raise_error("character must have a name")
    end
  end

  describe "#hp" do
    let(:gandalf) { described_class.new(name: 'Gandalf', level:10) }
    let(:balrog)  { described_class.new(name: 'Balrog', hp: 200) }

    it "increase based on level" do
      expect(frodo.hp).to eq 4
      expect(gandalf.hp).to eq 26
    end
    it "can be set on create" do
      expect(balrog.hp).to eq 200
    end
  end

  describe "#max_hp" do
    it "raise when level up" do
      expect(frodo.max_hp).to eq 4
      frodo.level = 5
      expect(frodo.max_hp).to eq 14
    end
  end

  describe "#dead?" do
    it "false when character have hp" do
      frodo.hp = 1
      expect(frodo.dead?).to be false
      frodo.hp = 0
      expect(frodo.dead?).to be true
    end
  end

  describe "#hit!" do
    it "decrease character hp" do
      frodo.hp = 3
      expect(frodo.hit!(2)).to eq 1
      expect(frodo.hp).to eq 1
    end
    it "can kill player" do
      frodo.hit! frodo.hp
      expect(frodo.dead?).to be true
    end
    it "hp can be negative" do
      frodo.hp = 3
      expect(frodo.hit!(100)).to eq 0
    end
    it "if have armor damage is reduced" do
      frodo.armor = leater_armor
      frodo.hp = 4
      expect(frodo.hit!(11)).to eq 3
      expect(frodo.hp).to eq 3
    end
  end

  describe "#to_s" do
    it "say my name" do
      expect(frodo.to_s).to eq "Frodo"
    end
  end

  describe "#weapon" do
    let(:sam) { described_class.new(name: 'Sam', weapon: sting) }
    it "set on create" do
      expect(sam.weapon).to eq sting
    end
  end

  describe "#armor" do
    let(:aragorn) { described_class.new(name: 'Aragorn', armor: leater_armor) }

    it "set on create" do
      expect(aragorn.armor).to eq leater_armor
    end
  end

  describe "#attack" do
    let!(:orc)  { described_class.new name: 'Common Orc', hp: 11 }
    let(:rock)  { double('Rock') }

    it "target must be valid" do
      expect(frodo.attack(rock)).to be false
    end
    it "target must be live" do
      dead_man = described_class.new name: 'dead man', hp: 0
      expect(frodo.attack(dead_man)).to be false
    end
    it "need to be armed" do
      expect(frodo.attack(orc)).to be false
    end
    it "target must be lost hp" do
      frodo.weapon = sting
      expect(frodo.attack(orc)).to eq 1
      expect(orc.hp).to eq 1
    end
  end

  describe '#say' do
    it "say hello" do
      expect { frodo.say 'hello' }.to output("Frodo say: hello\n").to_stdout
    end
  end

end
