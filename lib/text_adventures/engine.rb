module TextAdventures
  class Engine
    class << self

      # Return true if hash match with pool
      def valid_hash?(hash)
        clean_hash = hash.gsub(/[^a-z0-9]/, '')
        pool.key? clean_hash
      end

      # Create a new hash and adding to pool
      def new_game
        hash = Digest::MD5.hexdigest(Time.now.to_f.to_s)
        pool[hash] = nil
        hash
      end

      # Current game pool
      def pool
        @pool ||= {}
      end

    end
  end
end