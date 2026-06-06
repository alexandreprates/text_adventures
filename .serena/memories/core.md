# Core

- Small Ruby project for a text RPG concept; current checked-in implementation is minimal and does not include the server executable described by the older README.
- Source map:
  - `lib/text_adventures.rb`: Bundler bootstrap and library entrypoint; loads all files under `lib/core_exten/*.rb`.
  - `lib/core_exten/extent.rb`: defines the global `Extent` class for bounded numeric values with overflow tracking.
  - `spec/`: RSpec coverage for the current library behavior.
  - `README.rdoc`: gameplay planning and historical server notes; verify against actual files before treating as runnable behavior.
- Read `mem:tech_stack` for runtime/tooling pins and dependency shape.
- Read `mem:conventions` for code style and design patterns visible in the current codebase.
- Read `mem:suggested_commands` for useful project commands.
- Read `mem:task_completion` for completion checks.