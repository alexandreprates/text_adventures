module TextAdventures
  class Dungeon
    Position = Struct.new(:x, :y, keyword_init: true)

    WALL = "#".freeze
    OPEN = " ".freeze
    PLAYER = "x".freeze
    DEFAULT_LEVEL = 1
    DEFAULT_TILES = [
      "######",
      "######",
      "##   #",
      "######",
      "######"
    ].freeze
    DEFAULT_PLAYER_POSITION = Position.new(x: 3, y: 2).freeze

    attr_reader :level, :tiles, :player_position

    def initialize(
      level: DEFAULT_LEVEL,
      tiles: DEFAULT_TILES,
      player_position: DEFAULT_PLAYER_POSITION
    )
      @level = level
      @tiles = normalize_tiles(tiles)
      @player_position = Position.new(x: player_position.x, y: player_position.y)
      validate_player_position!
    end

    def width
      tiles.first.length
    end

    def height
      tiles.length
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

    def player_on_open_tile?
      open?(player_position.x, player_position.y)
    end

    def render
      lines = ["Ruins Level #{level}"]
      tiles.each_with_index do |row, y|
        rendered_row = row.each_char.with_index.map do |tile, x|
          player_at?(x, y) ? PLAYER : tile
        end.join
        lines << rendered_row
      end
      lines.join("\n")
    end

    private

    def normalize_tiles(value)
      rows = value.map(&:to_s)
      raise ArgumentError, "dungeon must have at least one row" if rows.empty?

      expected_width = rows.first.length
      raise ArgumentError, "dungeon rows cannot be empty" if expected_width.zero?
      raise ArgumentError, "dungeon rows must have the same width" unless rows.all? { |row| row.length == expected_width }
      raise ArgumentError, "dungeon tiles can only contain walls and open spaces" unless rows.all? { |row| row.match?(/\A[#{Regexp.escape(WALL + OPEN)}]+\z/) }

      rows.freeze
    end

    def validate_player_position!
      return if player_on_open_tile?

      raise ArgumentError, "player must start on an open dungeon tile"
    end

    def player_at?(x, y)
      player_position.x == x && player_position.y == y
    end
  end
end
