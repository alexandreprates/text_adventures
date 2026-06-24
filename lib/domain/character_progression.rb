module TextAdventures
  class CharacterProgression
    SKILL_TRACKS = %i[
      swordsmanship
      spearmanship
      dagger_mastery
      combat_magic
      nature_magic
    ].freeze
    BASE_CLASS_NAME = "Adventurer".freeze
    PURE_CLASS_NAMES = {
      swordsmanship: "Blademaster",
      spearmanship: "Dragoon",
      dagger_mastery: "Nightblade",
      combat_magic: "Arcanist",
      nature_magic: "Druid"
    }.freeze
    HYBRID_CLASS_NAMES = {
      %i[swordsmanship spearmanship] => "Warlord",
      %i[swordsmanship dagger_mastery] => "Duelist",
      %i[swordsmanship combat_magic] => "Spellblade",
      %i[swordsmanship nature_magic] => "Warden",
      %i[spearmanship dagger_mastery] => "Skirmisher",
      %i[spearmanship combat_magic] => "Battlemage",
      %i[spearmanship nature_magic] => "Sentinel",
      %i[dagger_mastery combat_magic] => "Hexblade",
      %i[dagger_mastery nature_magic] => "Ranger",
      %i[combat_magic nature_magic] => "Mystic"
    }.freeze
    PURE_CLASS_LEVEL_LEAD = 2

    attr_reader :skill_experience

    def self.xp_required_for(level)
      250 * level * level
    end

    def initialize(skill_experience: {})
      @skill_experience = normalize_skill_experience(skill_experience)
    end

    def add_skill_xp(skill, amount)
      normalized_skill = normalize_skill(skill)
      raise ArgumentError, "unknown skill track: #{skill}" unless SKILL_TRACKS.include?(normalized_skill)
      raise ArgumentError, "xp amount cannot be negative" if amount.negative?

      skill_experience[normalized_skill] += amount
      self
    end

    def skill_xp(skill)
      skill_experience.fetch(normalize_skill(skill))
    end

    def skill_level(skill)
      level_for(skill_xp(skill))
    end

    def skill_levels
      SKILL_TRACKS.to_h { |skill| [skill, skill_level(skill)] }
    end

    def total_class_level
      skill_levels.values.sum
    end

    def overall_experience
      skill_experience.values.sum
    end

    def overall_level
      level_for(overall_experience)
    end

    def current_class
      return BASE_CLASS_NAME if overall_experience.zero?

      primary, secondary = ranked_skills.first(2)
      level_lead = primary.fetch(:level) - secondary.fetch(:level)
      return PURE_CLASS_NAMES.fetch(primary.fetch(:skill)) if level_lead >= PURE_CLASS_LEVEL_LEAD

      HYBRID_CLASS_NAMES.fetch(class_pair(primary.fetch(:skill), secondary.fetch(:skill)))
    end

    def xp_required_for(level)
      self.class.xp_required_for(level)
    end

    private

    def normalize_skill_experience(value)
      base = SKILL_TRACKS.to_h { |skill| [skill, 0] }
      value.each_with_object(base) do |(skill, xp), result|
        normalized_skill = normalize_skill(skill)
        raise ArgumentError, "unknown skill track: #{skill}" unless SKILL_TRACKS.include?(normalized_skill)

        result[normalized_skill] = xp.to_i
      end
    end

    def normalize_skill(value)
      value.to_s.downcase.strip.tr(" ", "_").to_sym
    end

    def level_for(experience)
      level = 1
      level += 1 while experience >= xp_required_for(level)
      level
    end

    def ranked_skills
      SKILL_TRACKS.map do |skill|
        {
          skill: skill,
          level: skill_level(skill),
          xp: skill_xp(skill)
        }
      end.sort_by do |entry|
        [-entry.fetch(:level), -entry.fetch(:xp), SKILL_TRACKS.index(entry.fetch(:skill))]
      end
    end

    def class_pair(first, second)
      [first, second].sort_by { |skill| SKILL_TRACKS.index(skill) }
    end
  end
end
