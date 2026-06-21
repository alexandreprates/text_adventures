module TextAdventures
  class RandomSource
    STRATEGY = "ruby_seed_replay".freeze

    attr_reader :seed, :draws

    def self.from_snapshot(snapshot)
      raise ArgumentError, "random snapshot is required" unless snapshot
      raise ArgumentError, "unknown random strategy: #{snapshot.fetch('strategy')}" unless snapshot.fetch("strategy") == STRATEGY

      new(seed: snapshot.fetch("seed"), draws: snapshot.fetch("draws", []))
    end

    def initialize(seed: Random.new_seed, draws: [])
      @seed = Integer(seed)
      @draws = draws.map { |draw| normalize_snapshot_draw(draw) }
      @random = Random.new(@seed)
      @draws.each { |draw| replay(draw) }
    end

    def rand(limit = nil)
      draw = normalize_limit(limit)
      draws << draw
      replay(draw)
    end

    def snapshot
      {
        "strategy" => STRATEGY,
        "seed" => seed,
        "draws" => draws.map(&:dup)
      }
    end

    private

    attr_reader :random

    def normalize_snapshot_draw(draw)
      normalized = draw.transform_keys(&:to_s)
      case normalized.fetch("type")
      when "none"
        { "type" => "none" }
      when "integer"
        value = Integer(normalized.fetch("value"))
        raise ArgumentError, "random integer limit must be positive" unless value.positive?

        { "type" => "integer", "value" => value }
      when "range"
        {
          "type" => "range",
          "begin" => Integer(normalized.fetch("begin")),
          "end" => Integer(normalized.fetch("end")),
          "exclude_end" => !!normalized.fetch("exclude_end", false)
        }
      else
        raise ArgumentError, "unknown random draw type: #{normalized.fetch('type')}"
      end
    end

    def normalize_limit(limit)
      return { "type" => "none" } if limit.nil?

      if limit.is_a?(Integer)
        raise ArgumentError, "random integer limit must be positive" unless limit.positive?

        return { "type" => "integer", "value" => limit }
      end

      if limit.is_a?(Range) && limit.begin.is_a?(Integer) && limit.end.is_a?(Integer)
        return {
          "type" => "range",
          "begin" => limit.begin,
          "end" => limit.end,
          "exclude_end" => limit.exclude_end?
        }
      end

      raise ArgumentError, "unsupported random limit: #{limit.inspect}"
    end

    def replay(draw)
      case draw.fetch("type")
      when "none"
        random.rand
      when "integer"
        random.rand(draw.fetch("value"))
      when "range"
        random.rand(range_for(draw))
      end
    end

    def range_for(draw)
      first = draw.fetch("begin")
      last = draw.fetch("end")
      draw.fetch("exclude_end") ? (first...last) : (first..last)
    end
  end
end
