module TextAdventures
  class Engine
    class << self

      def valid_hash?(hash)
        clean_hash = hash.gsub(/[^a-z0-9]/, '')
        pool.key? clean_hash
      end

      def new_game
        hash = Digest::MD5.hexdigest(Time.now.to_f.to_s)
        pool[hash] = nil
        hash
      end

      def pool
        @pool ||= {}
      end

    end
  end
end