require 'spec_helper'

RSpec.describe TextAdventures::CharacterProgression do
  subject(:progression) { described_class.new }

  it "starts every skill track at zero XP and level one" do
    expect(progression.skill_experience).to eq(
      swordsmanship: 0,
      spearmanship: 0,
      dagger_mastery: 0,
      combat_magic: 0,
      nature_magic: 0
    )
    expect(progression.skill_levels.values).to all(eq 1)
    expect(progression.total_class_level).to eq 5
    expect(progression.overall_experience).to eq 0
    expect(progression.overall_level).to eq 1
    expect(progression.current_class).to eq "Adventurer"
  end

  it "normalizes injected skill experience" do
    progression = described_class.new(
      skill_experience: {
        "Swordsmanship" => 20,
        "combat magic" => 275
      }
    )

    expect(progression.skill_xp(:swordsmanship)).to eq 20
    expect(progression.skill_xp(:combat_magic)).to eq 275
    expect(progression.skill_xp(:nature_magic)).to eq 0
  end

  it "adds XP to one skill track and updates overall XP" do
    progression.add_skill_xp("dagger mastery", 255)

    expect(progression.skill_xp(:dagger_mastery)).to eq 255
    expect(progression.skill_level(:dagger_mastery)).to eq 2
    expect(progression.total_class_level).to eq 6
    expect(progression.overall_experience).to eq 255
    expect(progression.overall_level).to eq 2
  end

  it "uses the two strongest nearby skill tracks to name the current class" do
    progression.add_skill_xp(:swordsmanship, 255)
    progression.add_skill_xp(:combat_magic, 250)

    expect(progression.current_class).to eq "Spellblade"
  end

  it "uses a pure class when the strongest skill leads by at least two levels" do
    progression.add_skill_xp(:dagger_mastery, 1_000)
    progression.add_skill_xp(:nature_magic, 249)

    expect(progression.current_class).to eq "Nightblade"
  end

  it "uses XP and track order to break current class ties deterministically" do
    progression.add_skill_xp(:spearmanship, 275)
    progression.add_skill_xp(:combat_magic, 275)
    progression.add_skill_xp(:nature_magic, 280)

    expect(progression.current_class).to eq "Sentinel"
  end

  it "uses the configured quadratic level curve" do
    expect(described_class.xp_required_for(1)).to eq 250
    expect(described_class.xp_required_for(2)).to eq 1_000
    expect(described_class.xp_required_for(3)).to eq 2_250

    progression.add_skill_xp(:combat_magic, 999)

    expect(progression.skill_level(:combat_magic)).to eq 2
    expect(progression.overall_level).to eq 2

    progression.add_skill_xp(:combat_magic, 1)

    expect(progression.skill_level(:combat_magic)).to eq 3
    expect(progression.overall_level).to eq 3
  end

  it "rejects unknown skill tracks and negative XP" do
    expect do
      progression.add_skill_xp(:alchemy, 10)
    end.to raise_error(ArgumentError, "unknown skill track: alchemy")

    expect do
      progression.add_skill_xp(:nature_magic, -1)
    end.to raise_error(ArgumentError, "xp amount cannot be negative")
  end
end
