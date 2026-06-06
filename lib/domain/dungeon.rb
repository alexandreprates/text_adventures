module TextAdventures
  class Dungeon
    Position = Struct.new(:x, :y, keyword_init: true)
    MoveResult = Struct.new(:success?, :direction, :from, :to, :message, keyword_init: true)
    BlockPosition = Struct.new(:x, :y, keyword_init: true) do
      def key
        [x, y]
      end
    end

    PLAYER = "x".freeze
    FLOOR = ".".freeze
    DIRECTIONS = {
      "up" => [0, -1],
      "right" => [1, 0],
      "down" => [0, 1],
      "left" => [-1, 0]
    }.freeze
    OPPOSITE_DIRECTIONS = {
      "up" => "down",
      "right" => "left",
      "down" => "up",
      "left" => "right"
    }.freeze
    DEFAULT_LEVEL = 1
    DEFAULT_BLOCK_ID = "right_exit".freeze
    DEFAULT_PLAYER_POSITION = Position.new(x: 3, y: 2).freeze
    DEFAULT_BLOCK_POSITION = BlockPosition.new(x: 0, y: 0).freeze

    attr_reader :level, :revealed_blocks, :player_position, :current_block_position, :random

    def initialize(
      level: DEFAULT_LEVEL,
      revealed_blocks: nil,
      player_position: DEFAULT_PLAYER_POSITION,
      current_block_position: DEFAULT_BLOCK_POSITION,
      random: Random.new
    )
      @level = level
      @revealed_blocks = normalize_revealed_blocks(revealed_blocks)
      @player_position = Position.new(x: player_position.x, y: player_position.y)
      @current_block_position = BlockPosition.new(x: current_block_position.x, y: current_block_position.y)
      @random = random
      validate_current_block!
      validate_player_position!
    end

    def width
      current_block.width
    end

    def height
      current_block.height
    end

    def tiles
      current_block.tiles
    end

    def in_bounds?(x, y)
      x.between?(0, width - 1) && y.between?(0, height - 1)
    end

    def tile_at(x, y)
      current_block.tile_at(x, y)
    end

    def wall?(x, y)
      current_block.wall?(x, y)
    end

    def open?(x, y)
      current_block.open?(x, y)
    end

    def player_on_open_tile?
      open?(player_position.x, player_position.y)
    end

    def move(direction)
      normalized_direction = direction.to_s.downcase.strip
      delta = DIRECTIONS[normalized_direction]
      return failed_move(normalized_direction, "Unknown direction: #{direction}.") unless delta

      from = current_position
      to = Position.new(x: from.x + delta[0], y: from.y + delta[1])
      return move_across_exit(normalized_direction, from, to) unless in_bounds?(to.x, to.y)
      return failed_move(normalized_direction, "You cannot go #{normalized_direction}; a wall blocks the way.", from: from, to: to) if wall?(to.x, to.y)

      @player_position = to
      MoveResult.new(
        success?: true,
        direction: normalized_direction,
        from: from,
        to: to,
        message: "You move #{normalized_direction}."
      )
    end

    def render
      lines = ["Ruins Level #{level}"]
      composed_tiles.each_with_index do |row, y|
        rendered_row = row.each_with_index.map do |tile, x|
          player_at_render_position?(x, y) ? PLAYER : rendered_tile(tile)
        end.join
        lines << rendered_row
      end
      lines.join("\n")
    end

    private

    def normalize_revealed_blocks(value)
      blocks = value || { DEFAULT_BLOCK_POSITION.key => ContentCatalog.dungeon_block(DEFAULT_BLOCK_ID) }
      blocks.transform_keys { |key| normalize_block_key(key) }.transform_values do |block|
        block.is_a?(DungeonBlock) ? block : ContentCatalog.dungeon_block(block)
      end
    end

    def normalize_block_key(key)
      return key.key if key.respond_to?(:key)

      x, y = key
      [Integer(x), Integer(y)]
    end

    def validate_player_position!
      return if player_on_open_tile?

      raise ArgumentError, "player must start on an open dungeon tile"
    end

    def validate_current_block!
      return if revealed_blocks.key?(current_block_position.key)

      raise ArgumentError, "current block must be revealed"
    end

    def player_at?(x, y)
      player_position.x == x && player_position.y == y
    end

    def player_at_render_position?(x, y)
      render_position = player_render_position

      render_position.x == x && render_position.y == y
    end

    def rendered_tile(tile)
      tile == DungeonBlock::OPEN ? FLOOR : tile
    end

    def current_position
      Position.new(x: player_position.x, y: player_position.y)
    end

    def current_block
      revealed_blocks.fetch(current_block_position.key)
    end

    def move_across_exit(direction, from, attempted_to)
      return failed_move(direction, "You cannot go #{direction}; the path leaves the dungeon.", from: from, to: attempted_to) unless current_block.exit?(direction)

      next_block_position = adjacent_block_position(direction)
      next_block = revealed_blocks[next_block_position.key]
      return failed_move(direction, "You cannot go #{direction}; the path leaves the dungeon.", from: from, to: attempted_to) if next_block && !next_block.exit?(OPPOSITE_DIRECTIONS.fetch(direction))

      next_block ||= reveal_block(next_block_position, direction)
      return failed_move(direction, "You cannot go #{direction}; the path leaves the dungeon.", from: from, to: attempted_to) unless next_block

      @current_block_position = next_block_position
      @player_position = entry_position_for(direction)
      MoveResult.new(
        success?: true,
        direction: direction,
        from: from,
        to: current_position,
        message: "You move #{direction}."
      )
    end

    def reveal_block(block_position, direction)
      required_exit = OPPOSITE_DIRECTIONS.fetch(direction)
      candidates = ContentCatalog.dungeon_blocks.select do |block|
        block.exit?(required_exit) && compatible_with_neighbors?(block_position, block)
      end
      return nil if candidates.empty?

      selected = candidates[random.rand(candidates.length)]
      revealed_blocks[block_position.key] = selected
    end

    def compatible_with_neighbors?(block_position, block)
      DIRECTIONS.all? do |direction, delta|
        neighbor_position = [block_position.x + delta[0], block_position.y + delta[1]]
        neighbor = revealed_blocks[neighbor_position]
        next true unless neighbor

        opposite_direction = OPPOSITE_DIRECTIONS.fetch(direction)
        block.exit?(direction) == neighbor.exit?(opposite_direction)
      end
    end

    def adjacent_block_position(direction)
      delta = DIRECTIONS.fetch(direction)
      BlockPosition.new(
        x: current_block_position.x + delta[0],
        y: current_block_position.y + delta[1]
      )
    end

    def entry_position_for(direction)
      case direction
      when "up"
        Position.new(x: 2, y: height - 1)
      when "right"
        Position.new(x: 0, y: 2)
      when "down"
        Position.new(x: 2, y: 0)
      when "left"
        Position.new(x: width - 1, y: 2)
      end
    end

    def composed_tiles
      bounds = block_bounds
      rows = Array.new((bounds.fetch(:max_y) - bounds.fetch(:min_y) + 1) * height) do
        Array.new((bounds.fetch(:max_x) - bounds.fetch(:min_x) + 1) * width, " ")
      end

      revealed_blocks.each do |(block_x, block_y), block|
        x_offset = (block_x - bounds.fetch(:min_x)) * width
        y_offset = (block_y - bounds.fetch(:min_y)) * height

        block.tiles.each_with_index do |row, local_y|
          row.each_char.with_index do |tile, local_x|
            rows[y_offset + local_y][x_offset + local_x] = tile
          end
        end
      end

      rows
    end

    def block_bounds
      block_xs = revealed_blocks.keys.map(&:first)
      block_ys = revealed_blocks.keys.map(&:last)

      {
        min_x: block_xs.min,
        max_x: block_xs.max,
        min_y: block_ys.min,
        max_y: block_ys.max
      }
    end

    def player_render_position
      bounds = block_bounds
      Position.new(
        x: (current_block_position.x - bounds.fetch(:min_x)) * width + player_position.x,
        y: (current_block_position.y - bounds.fetch(:min_y)) * height + player_position.y
      )
    end

    def failed_move(direction, message, from: current_position, to: current_position)
      MoveResult.new(
        success?: false,
        direction: direction,
        from: from,
        to: to,
        message: message
      )
    end
  end
end
