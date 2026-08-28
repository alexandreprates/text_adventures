require 'spec_helper'

RSpec.describe TextAdventures::ClassPassive do
  EXPECTED_PASSIVES = {
    "Blademaster" => ["Perfect Edge", { sword: 15 }],
    "Dragoon" => ["Piercing Momentum", { spear: 15 }],
    "Nightblade" => ["Lethal Precision", { dagger: 15 }],
    "Arcanist" => ["Arcane Supremacy", { combat_magic: 15 }],
    "Druid" => ["Primal Communion", { nature_magic: 15 }],
    "Warlord" => ["Master of Arms", { sword: 10, spear: 10 }],
    "Duelist" => ["Weapon Finesse", { sword: 10, dagger: 10 }],
    "Spellblade" => ["Arcane Edge", { sword: 10, combat_magic: 10 }],
    "Warden" => ["Verdant Blade", { sword: 10, nature_magic: 10 }],
    "Skirmisher" => ["Mobile Arsenal", { spear: 10, dagger: 10 }],
    "Battlemage" => ["War Channeling", { spear: 10, combat_magic: 10 }],
    "Sentinel" => ["Guardian's Vigor", { spear: 10, nature_magic: 10 }],
    "Hexblade" => ["Maledict Edge", { dagger: 10, combat_magic: 10 }],
    "Ranger" => ["Wild Hunt", { dagger: 10, nature_magic: 10 }],
    "Mystic" => ["Unified Arcana", { combat_magic: 10, nature_magic: 10 }]
  }.freeze

  describe ".for_class" do
    it "defines the approved passive for every advanced class" do
      EXPECTED_PASSIVES.each do |class_name, (name, effects)|
        passive = described_class.for_class(class_name)

        expect(passive).to have_attributes(name: name, effects: effects)
      end
    end

    it "does not grant a passive to Adventurer or unknown classes" do
      expect(described_class.for_class("Adventurer")).to be_nil
      expect(described_class.for_class("Unknown")).to be_nil
    end

    it "exposes a normalized id and readable descriptions" do
      expect(described_class.for_class("Blademaster")).to have_attributes(
        id: "blademaster",
        description: "+15% sword damage."
      )
      expect(described_class.for_class("Spellblade").description).to eq(
        "+10% sword damage and +10% Combat Magic damage."
      )
    end
  end

  describe "#apply" do
    subject(:passive) { described_class.for_class("Blademaster") }

    it "rounds a compatible percentage bonus to the nearest integer" do
      expect(passive.apply(15, affinity: :sword)).to eq 17
    end

    it "leaves incompatible affinities unchanged" do
      expect(passive.apply(15, affinity: :spear)).to eq 15
    end
  end
end
