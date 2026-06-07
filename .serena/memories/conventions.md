# Conventions

- Library entrypoint uses relative glob loading: `Dir['./lib/core_exten/*.rb'].each { |file| require file }`; new core extensions under that directory load automatically through `lib/text_adventures.rb`.
- Existing extension classes are defined at top level, not inside `TextAdventures`; preserve or intentionally migrate references when changing that boundary.
- `Extent` operations are immutable-style: `+` and `-` return new instances preserving `min`/`max` and setting `overload`, instead of mutating the receiver.
- RSpec style uses `RSpec.describe`, `subject`, `let`, `have_attributes`, predicate matchers, and nested `context` blocks.
- Existing Ruby formatting is compact: two-space indentation, hash keyword syntax without spaces in specs (`{max: 50, min: 0}`), double quotes in Guardfile, mostly single quotes elsewhere.
- Comments/docs are sparse except for class-level explanatory docs; keep durable API docs near the class when behavior is non-obvious.