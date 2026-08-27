module TextAdventures
  class DungeonBlock
    WALL = "#".freeze
    OPEN = " ".freeze
    WIDTH = 6
    HEIGHT = 5
    VALID_EXITS = %w[up right down left].freeze
    VALID_DECORATION_KINDS = %w[torch chest barrel rubble banner].freeze

    attr_reader :id, :name, :tiles, :exits, :theme, :decorations

    def initialize(id:, name:, tiles:, exits:, visuals: {})
      @id = id.to_s
      @name = name.to_s
      @tiles = normalize_tiles(tiles)
      @exits = normalize_exits(exits)
      @theme = visuals.fetch("theme", visuals.fetch(:theme, "stone_ruins")).to_s
      @decorations = normalize_decorations(
        visuals.fetch("decorations", visuals.fetch(:decorations, []))
      )
    end

    def width
      WIDTH
    end

    def height
      HEIGHT
    end

    def exit?(direction)
      exits.include?(direction.to_s)
    end

    def in_bounds?(x, y)
      x.between?(0, width - 1) && y.between?(0, height - 1)
    end

    def tile_at(x, y)
      return nil unless in_bounds?(x, y)

      tiles[y][x]
    end

    def wall?(x, y)
      tile_at(x, y) == WALL
    end

    def open?(x, y)
      tile_at(x, y) == OPEN
    end

    private

    def normalize_tiles(value)
      rows = value.map(&:to_s)
      raise ArgumentError, "dungeon block must have #{HEIGHT} rows" unless rows.length == HEIGHT
      raise ArgumentError, "dungeon block rows must be #{WIDTH} tiles wide" unless rows.all? { |row| row.length == WIDTH }
      raise ArgumentError, "dungeon block tiles can only contain walls and open spaces" unless rows.all? { |row| row.match?(/\A[#{Regexp.escape(WALL + OPEN)}]+\z/) }

      rows.freeze
    end

    def normalize_exits(value)
      directions = value.map(&:to_s)
      unknown_exits = directions - VALID_EXITS
      raise ArgumentError, "unknown dungeon block exits: #{unknown_exits.join(', ')}" unless unknown_exits.empty?

      directions.uniq.freeze
    end

    def normalize_decorations(value)
      value.map do |entry|
        decoration = entry.transform_keys(&:to_s)
        kind = decoration.fetch("kind").to_s
        x = Integer(decoration.fetch("x"))
        y = Integer(decoration.fetch("y"))
        raise ArgumentError, "unknown dungeon decoration: #{kind}" unless VALID_DECORATION_KINDS.include?(kind)
        raise ArgumentError, "dungeon decoration must be inside its block" unless in_bounds?(x, y)
        if kind == "torch" && !right_side_wall_mount?(x, y)
          raise ArgumentError, "torch decoration must be fixed to a right-side wall"
        end

        normalized = { kind: kind, x: x, y: y }
        normalized[:variant] = decoration.fetch("variant").to_s if decoration.key?("variant")
        normalized.freeze
      end.freeze
    end

    def right_side_wall_mount?(x, y)
      wall?(x, y) && open?(x, y + 1)
    end
  end
end
