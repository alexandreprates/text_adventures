module TextAdventures
  module Persistence
    Error = Class.new(StandardError)
    InvalidGameId = Class.new(Error)
    SnapshotVersionError = Class.new(Error)
    SnapshotContentError = Class.new(Error)
  end
end
