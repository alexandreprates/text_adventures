module TextAdventures
  class CharacterProgression
    SKILL_TRACKS = %i[
      swordsmanship
      spearmanship
      dagger_mastery
      combat_magic
      nature_magic
    ].freeze

    attr_reader :skill_experience

    def self.xp_required_for(level)
      50 * level * level
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

    def overall_experience
      skill_experience.values.sum
    end

    def overall_level
      level_for(overall_experience)
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
  end
end
