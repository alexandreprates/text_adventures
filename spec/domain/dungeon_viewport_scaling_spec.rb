require 'spec_helper'

RSpec.describe 'Bounded dungeon viewport queries' do
  def dungeon_with_blocks(side, offset: 0)
    blocks = (offset...(offset + side)).flat_map do |y|
      (offset...(offset + side)).map { |x| [[x, y], 'four_exits'] }
    end.to_h
    TextAdventures::Dungeon.new(
      revealed_blocks: blocks,
      current_block_position: TextAdventures::Dungeon::BlockPosition.new(x: offset, y: offset),
      enemies: blocks.keys.to_h { |x, y| [[x * 6 + 1, y * 5 + 1], 'giant_spider'] },
      dropped_loot: blocks.keys.to_h { |x, y| [[x * 6 + 4, y * 5 + 3], TextAdventures::LootDrop.new(gold: 1)] }
    )
  end

  [1, 3, 20].each do |side|
    [0, -10].each do |offset|
      it "matches the visible subset of a full map with #{side * side} blocks at offset #{offset}" do
        dungeon = dungeon_with_blocks(side, offset: offset)
        viewport = dungeon.viewport_state
        origin = viewport.fetch(:origin)
        visible = lambda do |x, y|
          (x - origin[:x]).between?(0, viewport[:width] - 1) &&
            (y - origin[:y]).between?(0, viewport[:height] - 1)
        end
        expected_decorations = dungeon.revealed_blocks.flat_map do |(bx, by), block|
          block.decorations.filter_map do |decoration|
            x = bx * 6 + decoration[:x]
            y = by * 5 + decoration[:y]
            next unless visible.call(x, y)

            decoration.slice(:kind, :variant).merge(x: x - origin[:x], y: y - origin[:y])
          end
        end.sort_by { |entry| [entry[:y], entry[:x], entry[:kind]] }
        expect(viewport[:decorations]).to eq expected_decorations
        expected_entities = dungeon.enemies.filter_map do |(x, y), creature|
          next unless visible.call(x, y)

          { type: 'enemy', x: x - origin[:x], y: y - origin[:y], creature_id: creature }
        end + dungeon.dropped_loot.keys.filter_map do |x, y|
          { type: 'loot', x: x - origin[:x], y: y - origin[:y] } if visible.call(x, y)
        end
        expect(viewport[:entities].select { |entity| %w[enemy loot].include?(entity[:type]) })
          .to eq expected_entities.sort_by { |entry| [entry[:y], entry[:x], entry[:type]] }
      end
    end
  end

  it 'bounds map and entity lookups independently of explored history' do
    dungeon = dungeon_with_blocks(32, offset: -16)
    [dungeon.revealed_blocks, dungeon.enemies, dungeon.dropped_loot].each do |collection|
      expect(collection).not_to receive(:each)
      expect(collection).not_to receive(:flat_map)
      expect(collection).not_to receive(:filter_map)
      expect(collection).not_to receive(:keys)
    end
    expect(dungeon.revealed_blocks).to receive(:[]).at_most(18).times.and_call_original
    expect(dungeon.enemies).to receive(:[]).at_most(270).times.and_call_original
    expect(dungeon.dropped_loot).to receive(:[]).at_most(270).times.and_call_original

    viewport = dungeon.viewport_state
    expect(viewport[:terrain].size).to eq 270
    expect(viewport[:entities].count { |entity| entity[:type] == 'enemy' }).to eq 4
  end
end
