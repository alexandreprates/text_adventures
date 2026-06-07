module TextAdventures
  module UI
    class ScreenRenderer
      DEFAULT_WIDTH = 80
      HEADER_INNER_WIDTH = 78
      LEFT_PANEL_WIDTH = 46
      RIGHT_PANEL_WIDTH = 31
      MAIN_PANEL_HEIGHT = 17
      LOG_HEIGHT = 5
      BAR_WIDTH = 10
      ELLIPSIS = "...".freeze

      def initialize(width: DEFAULT_WIDTH)
        @width = Integer(width)
      end

      attr_reader :width

      def truncate(value, width)
        target_width = Integer(width)
        return "" if target_width <= 0

        text = value.to_s
        return text if text.length <= target_width
        return ELLIPSIS[0, target_width] if target_width <= ELLIPSIS.length

        "#{text[0, target_width - ELLIPSIS.length]}#{ELLIPSIS}"
      end

      def pad(value, width, align: :left)
        target_width = Integer(width)
        text = truncate(value, target_width)
        padding = target_width - text.length

        case align
        when :right
          "#{' ' * padding}#{text}"
        when :center
          left_padding = padding / 2
          right_padding = padding - left_padding
          "#{' ' * left_padding}#{text}#{' ' * right_padding}"
        else
          "#{text}#{' ' * padding}"
        end
      end

      def blank_lines(count, width)
        Array.new(Integer(count)) { " " * Integer(width) }
      end

      def bar(current, maximum, width: BAR_WIDTH, fill: "#", empty: "-")
        target_width = Integer(width)
        return "[]" if target_width <= 0

        maximum_value = [Integer(maximum), 1].max
        current_value = [[Integer(current), 0].max, maximum_value].min
        filled_width = (current_value * target_width / maximum_value.to_f).round
        empty_width = target_width - filled_width

        "[#{fill.to_s[0] * filled_width}#{empty.to_s[0] * empty_width}]"
      end

      def box(lines, width:, height: nil, title: nil)
        inner_width = Integer(width) - 2
        raise ArgumentError, "box width must be at least 2" if inner_width.negative?

        body_height = height ? Integer(height) : lines.length
        body_lines = lines.first(body_height).map { |line| pad(line, inner_width) }
        body_lines += blank_lines(body_height - body_lines.length, inner_width)

        [
          border_line(inner_width, title: title),
          *body_lines.map { |line| "|#{line}|" },
          border_line(inner_width)
        ]
      end

      def columns(left_lines, right_lines, left_width:, right_width:, height:)
        column_height = Integer(height)
        left = normalized_lines(left_lines, width: left_width, height: column_height)
        right = normalized_lines(right_lines, width: right_width, height: column_height)

        column_height.times.map do |index|
          "#{left[index]}|#{right[index]}"
        end
      end

      def center_lines(lines, width:, height:)
        target_width = Integer(width)
        target_height = Integer(height)
        visible_lines = lines.first(target_height).map { |line| pad(line, target_width, align: :center) }
        vertical_padding = target_height - visible_lines.length
        top_padding = vertical_padding / 2
        bottom_padding = vertical_padding - top_padding

        blank_lines(top_padding, target_width) + visible_lines + blank_lines(bottom_padding, target_width)
      end

      private

      def normalized_lines(lines, width:, height:)
        target_width = Integer(width)
        target_height = Integer(height)
        normalized = lines.first(target_height).map { |line| pad(line, target_width) }
        normalized + blank_lines(target_height - normalized.length, target_width)
      end

      def border_line(inner_width, title: nil)
        return "+#{'-' * inner_width}+" unless title

        label = " #{truncate(title, [inner_width - 2, 0].max)} "
        remaining = inner_width - label.length
        return "+#{truncate(label, inner_width)}+" if remaining.negative?

        "+#{label}#{'-' * remaining}+"
      end
    end
  end
end
