# Suggested Commands

- `gem install bundler` if `bundle` is missing in the local Ruby environment.
- `bundle config set --local path vendor/bundle` keeps installed gems inside the project and avoids system gem permission errors.
- `bundle install` installs project dependencies.
- `bundle exec rake` runs the default task, which maps to `spec` when RSpec is available.
- `bundle exec rspec` runs the full spec suite directly.
- `docker build -t text_adventures .` builds the Alpine Ruby image.
- `docker run --rm text_adventures` runs the Docker default command (`bundle exec rake`).