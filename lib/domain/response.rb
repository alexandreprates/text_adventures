module TextAdventures
  class Response
    attr_reader :lines

    def self.render(value)
      return value.to_text if value.respond_to?(:to_text)

      value.to_s
    end

    def initialize(*lines)
      @lines = lines.flatten.compact.map(&:to_s)
    end

    def append(*new_lines)
      self.class.new(lines + new_lines)
    end

    def to_text
      lines.join("\n")
    end

    def to_s
      to_text
    end
  end
end
